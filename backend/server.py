"""CVForge backend - AI CV generator with JWT auth, Stripe payments and PDF export."""
import os
import io
import uuid
import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import bcrypt
import jwt as pyjwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---- Config ----
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
JWT_ALG = "HS256"
JWT_EXP_DAYS = 30

# Pricing packages (server-side only, never trust client)
PRICING_PACKAGES = {
    "premium_monthly": {"amount": 9.99, "currency": "eur", "name": "Premium Mensuel"},
}

# Free tier limits
FREE_CV_LIMIT = 1

# Available templates
TEMPLATES = {
    "minimal": {"name": "Minimal", "premium": False},
    "modern": {"name": "Moderne", "premium": False},
    "executive": {"name": "Executive", "premium": True},
    "elegant": {"name": "Élégant", "premium": True},
}

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="CVForge API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cvforge")


# ============ Models ============
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    full_name: str
    is_premium: bool
    cvs_generated: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class Experience(BaseModel):
    title: str
    company: str
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class Education(BaseModel):
    degree: str
    school: str
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class CVInput(BaseModel):
    full_name: str
    email: str = ""
    phone: str = ""
    location: str = ""
    target_job: str
    summary: str = ""
    experiences: List[Experience] = []
    educations: List[Education] = []
    skills: List[str] = []
    languages: List[str] = []
    template: str = "minimal"


class CVOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    target_job: str
    full_name: str
    template: str
    created_at: str
    optimized: Dict[str, Any]


class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


class CheckoutStatusOut(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str
    is_premium: bool


# ============ Helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = pyjwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload.get("sub")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user


def user_to_out(user: dict) -> UserOut:
    return UserOut(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        is_premium=user.get("is_premium", False),
        cvs_generated=user.get("cvs_generated", 0),
    )


# ============ Auth ============
@api.post("/auth/register", response_model=TokenResponse)
async def register(body: UserSignup):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": body.email.lower(),
        "full_name": body.full_name.strip(),
        "password_hash": hash_password(body.password),
        "is_premium": False,
        "cvs_generated": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_doc["id"])
    return TokenResponse(access_token=token, user=user_to_out(user_doc))


@api.post("/auth/login", response_model=TokenResponse)
async def login(body: UserLogin):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=user_to_out(user))


@api.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return user_to_out(current)


# ============ AI Generation ============
async def optimize_cv_with_ai(cv: CVInput) -> Dict[str, Any]:
    """Use GPT-5.2 to rewrite CV content optimised for ATS and target job."""
    system_msg = (
        "Tu es un expert en rédaction de CV et en systèmes de recrutement automatisés (ATS). "
        "Tu aides les candidats francophones à rédiger des CV percutants, en français, "
        "optimisés avec les bons mots-clés pour passer les filtres ATS. "
        "Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après."
    )

    payload = {
        "full_name": cv.full_name,
        "target_job": cv.target_job,
        "summary": cv.summary,
        "experiences": [e.model_dump() for e in cv.experiences],
        "educations": [e.model_dump() for e in cv.educations],
        "skills": cv.skills,
        "languages": cv.languages,
    }

    prompt = (
        f"Voici les données brutes d'un candidat visant le poste : {cv.target_job}.\n\n"
        f"Données: {json.dumps(payload, ensure_ascii=False)}\n\n"
        "Réécris/optimise le contenu en français, percutant, orienté résultats, avec mots-clés ATS pour ce poste. "
        "Retourne STRICTEMENT le JSON suivant (aucun autre texte) :\n"
        "{\n"
        '  "summary": "<résumé professionnel 3-4 phrases percutantes>",\n'
        '  "experiences": [{"title": "...", "company": "...", "start_date": "...", "end_date": "...", "bullets": ["...", "..."]}],\n'
        '  "educations": [{"degree": "...", "school": "...", "start_date": "...", "end_date": "...", "description": "..."}],\n'
        '  "skills": ["...", "..."],\n'
        '  "languages": ["...", "..."],\n'
        '  "ats_keywords": ["...", "..."],\n'
        '  "ats_score": 85\n'
        "}\n"
        "Pour chaque expérience, transforme la description en 3-5 bullet points orientés impact (verbes d'action, chiffres). "
        "ats_score est un entier 0-100 estimant l'adéquation au poste cible."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"cv-{uuid.uuid4()}",
        system_message=system_msg,
    ).with_model("openai", "gpt-5.2")

    response = await chat.send_message(UserMessage(text=prompt))
    text = (response or "").strip()

    # Strip markdown fences if model misbehaves
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    # Sometimes models wrap; find JSON braces
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.error(f"AI JSON parse failed: {text[:500]}")
        # Fallback : retourne les données brutes formatées
        data = {
            "summary": cv.summary or f"Candidat motivé visant le poste de {cv.target_job}.",
            "experiences": [
                {
                    "title": e.title,
                    "company": e.company,
                    "start_date": e.start_date,
                    "end_date": e.end_date,
                    "bullets": [e.description] if e.description else [],
                }
                for e in cv.experiences
            ],
            "educations": [e.model_dump() for e in cv.educations],
            "skills": cv.skills,
            "languages": cv.languages,
            "ats_keywords": [],
            "ats_score": 60,
        }

    # Ensure required keys
    data.setdefault("summary", "")
    data.setdefault("experiences", [])
    data.setdefault("educations", [])
    data.setdefault("skills", [])
    data.setdefault("languages", [])
    data.setdefault("ats_keywords", [])
    data.setdefault("ats_score", 70)
    return data


# ============ CV Endpoints ============
@api.post("/cv/generate", response_model=CVOut)
async def generate_cv(cv: CVInput, current=Depends(get_current_user)):
    # Limit check
    if not current.get("is_premium", False) and current.get("cvs_generated", 0) >= FREE_CV_LIMIT:
        raise HTTPException(
            status_code=402,
            detail="Limite gratuite atteinte. Passez à Premium pour des CV illimités.",
        )

    # Premium template gating
    tpl = TEMPLATES.get(cv.template, TEMPLATES["minimal"])
    if tpl["premium"] and not current.get("is_premium", False):
        raise HTTPException(
            status_code=402,
            detail="Ce modèle est réservé aux membres Premium.",
        )

    optimized = await optimize_cv_with_ai(cv)

    cv_id = str(uuid.uuid4())
    doc = {
        "id": cv_id,
        "user_id": current["id"],
        "target_job": cv.target_job,
        "full_name": cv.full_name,
        "email": cv.email,
        "phone": cv.phone,
        "location": cv.location,
        "template": cv.template,
        "raw_input": cv.model_dump(),
        "optimized": optimized,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cvs.insert_one(doc)
    await db.users.update_one({"id": current["id"]}, {"$inc": {"cvs_generated": 1}})

    return CVOut(
        id=cv_id,
        user_id=current["id"],
        target_job=cv.target_job,
        full_name=cv.full_name,
        template=cv.template,
        created_at=doc["created_at"],
        optimized=optimized,
    )


@api.get("/cv/list", response_model=List[CVOut])
async def list_cvs(current=Depends(get_current_user)):
    items = await db.cvs.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [
        CVOut(
            id=i["id"],
            user_id=i["user_id"],
            target_job=i["target_job"],
            full_name=i["full_name"],
            template=i.get("template", "minimal"),
            created_at=i["created_at"],
            optimized=i.get("optimized", {}),
        )
        for i in items
    ]


@api.get("/cv/{cv_id}")
async def get_cv(cv_id: str, current=Depends(get_current_user)):
    item = await db.cvs.find_one({"id": cv_id, "user_id": current["id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="CV introuvable")
    item.pop("password_hash", None)
    return item


@api.delete("/cv/{cv_id}")
async def delete_cv(cv_id: str, current=Depends(get_current_user)):
    res = await db.cvs.delete_one({"id": cv_id, "user_id": current["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="CV introuvable")
    return {"ok": True}


@api.put("/cv/{cv_id}/template")
async def update_template(cv_id: str, body: dict, current=Depends(get_current_user)):
    template = body.get("template", "minimal")
    tpl = TEMPLATES.get(template)
    if not tpl:
        raise HTTPException(status_code=400, detail="Modèle invalide")
    if tpl["premium"] and not current.get("is_premium", False):
        raise HTTPException(status_code=402, detail="Modèle Premium réservé")
    await db.cvs.update_one(
        {"id": cv_id, "user_id": current["id"]},
        {"$set": {"template": template}},
    )
    return {"ok": True, "template": template}


@api.get("/cv/{cv_id}/pdf")
async def download_pdf(cv_id: str, current=Depends(get_current_user)):
    item = await db.cvs.find_one({"id": cv_id, "user_id": current["id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="CV introuvable")
    pdf_bytes = build_pdf(item)
    filename = f"CV_{item['full_name'].replace(' ', '_')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============ Templates list ============
@api.get("/templates")
async def get_templates():
    return [
        {"id": k, "name": v["name"], "premium": v["premium"]}
        for k, v in TEMPLATES.items()
    ]


# ============ PDF builder ============
def build_pdf(cv_doc: dict) -> bytes:
    template = cv_doc.get("template", "minimal")
    optimized = cv_doc.get("optimized", {})

    accent_colors = {
        "minimal": HexColor("#0f172a"),
        "modern": HexColor("#002FA7"),
        "executive": HexColor("#7a1f1f"),
        "elegant": HexColor("#1f4d3a"),
    }
    accent = accent_colors.get(template, HexColor("#0f172a"))

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"CV {cv_doc.get('full_name','')}",
    )

    styles = getSampleStyleSheet()
    name_style = ParagraphStyle(
        "Name", parent=styles["Heading1"], fontSize=24, leading=28,
        textColor=accent, spaceAfter=2, fontName="Helvetica-Bold",
    )
    role_style = ParagraphStyle(
        "Role", parent=styles["Normal"], fontSize=12, leading=14,
        textColor=HexColor("#475569"), spaceAfter=4, fontName="Helvetica",
    )
    contact_style = ParagraphStyle(
        "Contact", parent=styles["Normal"], fontSize=9, leading=12,
        textColor=HexColor("#64748b"), spaceAfter=10,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"], fontSize=11, leading=14,
        textColor=accent, spaceBefore=10, spaceAfter=4,
        fontName="Helvetica-Bold", textTransform="uppercase",
    )
    job_title_style = ParagraphStyle(
        "JobTitle", parent=styles["Normal"], fontSize=11, leading=14,
        textColor=HexColor("#0f172a"), fontName="Helvetica-Bold", spaceBefore=4,
    )
    company_style = ParagraphStyle(
        "Company", parent=styles["Normal"], fontSize=10, leading=12,
        textColor=HexColor("#475569"), fontName="Helvetica-Oblique", spaceAfter=2,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"], fontSize=10, leading=14,
        textColor=HexColor("#1e293b"),
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=body_style, leftIndent=10, bulletIndent=0,
        spaceBefore=1, spaceAfter=1,
    )

    story = []

    # Header
    full_name = cv_doc.get("full_name", "")
    story.append(Paragraph(full_name, name_style))
    story.append(Paragraph(cv_doc.get("target_job", ""), role_style))

    contact_parts = []
    if cv_doc.get("email"):
        contact_parts.append(cv_doc["email"])
    if cv_doc.get("phone"):
        contact_parts.append(cv_doc["phone"])
    if cv_doc.get("location"):
        contact_parts.append(cv_doc["location"])
    if contact_parts:
        story.append(Paragraph(" • ".join(contact_parts), contact_style))

    story.append(HRFlowable(width="100%", thickness=1, color=accent, spaceAfter=8))

    # Summary
    if optimized.get("summary"):
        story.append(Paragraph("PROFIL", section_style))
        story.append(Paragraph(optimized["summary"], body_style))

    # Experiences
    experiences = optimized.get("experiences", [])
    if experiences:
        story.append(Paragraph("EXPÉRIENCE PROFESSIONNELLE", section_style))
        for exp in experiences:
            title = exp.get("title", "")
            company = exp.get("company", "")
            dates = " — ".join(filter(None, [exp.get("start_date", ""), exp.get("end_date", "")]))
            story.append(Paragraph(f"{title}", job_title_style))
            comp_line = company
            if dates:
                comp_line = f"{company} · {dates}" if company else dates
            if comp_line:
                story.append(Paragraph(comp_line, company_style))
            for b in exp.get("bullets", []) or []:
                if b:
                    story.append(Paragraph(f"• {b}", bullet_style))

    # Education
    educations = optimized.get("educations", [])
    if educations:
        story.append(Paragraph("FORMATION", section_style))
        for ed in educations:
            degree = ed.get("degree", "")
            school = ed.get("school", "")
            dates = " — ".join(filter(None, [ed.get("start_date", ""), ed.get("end_date", "")]))
            story.append(Paragraph(degree, job_title_style))
            line = school
            if dates:
                line = f"{school} · {dates}" if school else dates
            if line:
                story.append(Paragraph(line, company_style))
            if ed.get("description"):
                story.append(Paragraph(ed["description"], body_style))

    # Skills
    skills = optimized.get("skills", []) or []
    if skills:
        story.append(Paragraph("COMPÉTENCES", section_style))
        story.append(Paragraph(" · ".join(skills), body_style))

    # Languages
    langs = optimized.get("languages", []) or []
    if langs:
        story.append(Paragraph("LANGUES", section_style))
        story.append(Paragraph(" · ".join(langs), body_style))

    doc.build(story)
    return buf.getvalue()


# ============ Stripe payments ============
@api.post("/payments/checkout/session", response_model=CheckoutResponse)
async def create_checkout(body: CheckoutRequest, request: Request, current=Depends(get_current_user)):
    pkg = PRICING_PACKAGES.get(body.package_id)
    if not pkg:
        raise HTTPException(status_code=400, detail="Forfait inconnu")

    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing"

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "user_id": current["id"],
        "user_email": current["email"],
        "package_id": body.package_id,
    }

    req = CheckoutSessionRequest(
        amount=float(pkg["amount"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe.create_checkout_session(req)

    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "user_id": current["id"],
            "user_email": current["email"],
            "package_id": body.package_id,
            "amount": pkg["amount"],
            "currency": pkg["currency"],
            "status": "initiated",
            "payment_status": "pending",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    return CheckoutResponse(url=session.url, session_id=session.session_id)


@api.get("/payments/checkout/status/{session_id}", response_model=CheckoutStatusOut)
async def checkout_status(session_id: str, request: Request, current=Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if txn["user_id"] != current["id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status_resp = await stripe.get_checkout_status(session_id)

    # If newly paid and not already processed -> upgrade user
    already_paid = txn.get("payment_status") == "paid"
    if status_resp.payment_status == "paid" and not already_paid:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status_resp.status,
                "payment_status": status_resp.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        await db.users.update_one({"id": current["id"]}, {"$set": {"is_premium": True}})
    else:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status_resp.status,
                "payment_status": status_resp.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )

    user = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return CheckoutStatusOut(
        status=status_resp.status,
        payment_status=status_resp.payment_status,
        amount_total=float(status_resp.amount_total) / 100.0,
        currency=status_resp.currency,
        is_premium=bool(user.get("is_premium", False)) if user else False,
    )


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        event = await stripe.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook invalide")

    if event.payment_status == "paid" and event.session_id:
        txn = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
        if txn and txn.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": event.session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}},
            )
            user_id = (event.metadata or {}).get("user_id") or txn.get("user_id")
            if user_id:
                await db.users.update_one({"id": user_id}, {"$set": {"is_premium": True}})
    return {"ok": True}


# ============ Health ============
@api.get("/")
async def root():
    return {"service": "CVForge API", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
