"""End-to-end backend tests for CVForge API (auth, CV CRUD, templates, payments, webhook)."""
import os
import uuid
import time
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"


# ---------- Health ----------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{BASE}/", timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_register_success(self, http):
        email = f"test_{uuid.uuid4().hex[:8]}@cvforge.dev"
        r = http.post(f"{BASE}/auth/register",
                      json={"email": email, "password": "TestPass123!", "full_name": "Jean Test"},
                      timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["is_premium"] is False
        assert data["user"]["cvs_generated"] == 0
        assert data["token_type"] == "bearer"

    def test_register_duplicate(self, http, registered_user):
        r = http.post(f"{BASE}/auth/register", json={
            "email": registered_user["email"],
            "password": "TestPass123!",
            "full_name": "Dup",
        }, timeout=15)
        assert r.status_code == 400
        assert "déjà utilisé" in r.json().get("detail", "")

    def test_login_success(self, http, registered_user):
        r = http.post(f"{BASE}/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        }, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == registered_user["email"]

    def test_login_invalid(self, http, registered_user):
        r = http.post(f"{BASE}/auth/login", json={
            "email": registered_user["email"],
            "password": "WrongPass!",
        }, timeout=15)
        assert r.status_code == 401

    def test_me_no_token(self, http):
        r = http.get(f"{BASE}/auth/me", timeout=10)
        # HTTPBearer auto_error=False + our check returns 401
        assert r.status_code == 401

    def test_me_valid_token(self, http, auth_headers, registered_user):
        r = requests.get(f"{BASE}/auth/me", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == registered_user["email"]

    def test_me_invalid_token(self):
        r = requests.get(f"{BASE}/auth/me",
                         headers={"Authorization": "Bearer invalid.token.here"},
                         timeout=10)
        assert r.status_code == 401


# ---------- Templates ----------
class TestTemplates:
    def test_templates_list(self):
        r = requests.get(f"{BASE}/templates", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 4
        ids = {t["id"] for t in data}
        assert ids == {"minimal", "modern", "executive", "elegant"}
        premium_map = {t["id"]: t["premium"] for t in data}
        assert premium_map["minimal"] is False
        assert premium_map["modern"] is False
        assert premium_map["executive"] is True
        assert premium_map["elegant"] is True


# ---------- CV Flow ----------
CV_INPUT = {
    "full_name": "Marie Dubois",
    "email": "marie@example.com",
    "phone": "+33 6 12 34 56 78",
    "location": "Paris, France",
    "target_job": "Développeuse Full Stack Senior",
    "summary": "Développeuse avec 5 ans d'expérience en React et FastAPI.",
    "experiences": [{
        "title": "Développeuse Full Stack",
        "company": "TechCorp",
        "start_date": "2021-01",
        "end_date": "2024-12",
        "description": "Développement de plateformes SaaS en React/FastAPI, encadrement d'équipe.",
    }],
    "educations": [{
        "degree": "Master Informatique",
        "school": "Université Paris-Saclay",
        "start_date": "2016",
        "end_date": "2018",
        "description": "Spécialité génie logiciel.",
    }],
    "skills": ["React", "FastAPI", "Python", "MongoDB"],
    "languages": ["Français", "Anglais"],
    "template": "minimal",
}


class TestCV:
    created_cv_id = None

    def test_generate_cv_requires_auth(self):
        r = requests.post(f"{BASE}/cv/generate", json=CV_INPUT, timeout=15)
        assert r.status_code == 401

    def test_generate_premium_template_blocked_for_free(self, auth_headers):
        payload = {**CV_INPUT, "template": "executive"}
        r = requests.post(f"{BASE}/cv/generate", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 402
        assert "Premium" in r.json().get("detail", "") or "réservé" in r.json().get("detail", "")

    def test_generate_cv_success(self, auth_headers, registered_user):
        r = requests.post(f"{BASE}/cv/generate", json=CV_INPUT, headers=auth_headers, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        assert data["target_job"] == CV_INPUT["target_job"]
        assert data["full_name"] == CV_INPUT["full_name"]
        assert data["template"] == "minimal"
        assert data["user_id"] == registered_user["user"]["id"]
        opt = data["optimized"]
        # Required keys per spec
        for key in ["summary", "experiences", "educations", "skills", "languages",
                    "ats_keywords", "ats_score"]:
            assert key in opt, f"missing {key} in optimized"
        assert isinstance(opt["ats_score"], (int, float))
        TestCV.created_cv_id = data["id"]

        # verify cvs_generated incremented
        me = requests.get(f"{BASE}/auth/me", headers=auth_headers, timeout=10).json()
        assert me["cvs_generated"] == 1

    def test_generate_second_cv_limit(self, auth_headers):
        r = requests.post(f"{BASE}/cv/generate", json=CV_INPUT, headers=auth_headers, timeout=30)
        assert r.status_code == 402
        assert "Limite gratuite" in r.json().get("detail", "")

    def test_list_cvs(self, auth_headers):
        r = requests.get(f"{BASE}/cv/list", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(c["id"] == TestCV.created_cv_id for c in data)

    def test_get_cv_owner(self, auth_headers):
        assert TestCV.created_cv_id
        r = requests.get(f"{BASE}/cv/{TestCV.created_cv_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == TestCV.created_cv_id
        # Should not expose mongodb _id
        assert "_id" not in data

    def test_get_cv_not_owner(self, http):
        # Register a 2nd user
        email2 = f"other_{uuid.uuid4().hex[:8]}@cvforge.dev"
        r = http.post(f"{BASE}/auth/register", json={
            "email": email2, "password": "TestPass123!", "full_name": "Autre"
        }, timeout=15)
        assert r.status_code == 200
        token2 = r.json()["access_token"]
        r2 = requests.get(f"{BASE}/cv/{TestCV.created_cv_id}",
                          headers={"Authorization": f"Bearer {token2}"}, timeout=15)
        # Returns 404 because the find query includes user_id
        assert r2.status_code == 404

    def test_update_template_premium_blocked(self, auth_headers):
        r = requests.put(
            f"{BASE}/cv/{TestCV.created_cv_id}/template",
            json={"template": "elegant"},
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 402

    def test_update_template_success(self, auth_headers):
        r = requests.put(
            f"{BASE}/cv/{TestCV.created_cv_id}/template",
            json={"template": "modern"},
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["template"] == "modern"

        # Verify persistence
        g = requests.get(f"{BASE}/cv/{TestCV.created_cv_id}", headers=auth_headers, timeout=10).json()
        assert g["template"] == "modern"

    def test_update_template_invalid(self, auth_headers):
        r = requests.put(
            f"{BASE}/cv/{TestCV.created_cv_id}/template",
            json={"template": "doesnotexist"},
            headers=auth_headers, timeout=15,
        )
        assert r.status_code == 400

    def test_pdf_download(self, auth_headers):
        r = requests.get(f"{BASE}/cv/{TestCV.created_cv_id}/pdf",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 1000

    def test_delete_cv(self, auth_headers):
        r = requests.delete(f"{BASE}/cv/{TestCV.created_cv_id}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # verify 404 after delete
        g = requests.get(f"{BASE}/cv/{TestCV.created_cv_id}", headers=auth_headers, timeout=10)
        assert g.status_code == 404


# ---------- Payments ----------
class TestPayments:
    session_id = None

    def test_checkout_requires_auth(self):
        r = requests.post(f"{BASE}/payments/checkout/session",
                          json={"package_id": "premium_monthly",
                                "origin_url": "https://example.com"},
                          timeout=15)
        assert r.status_code == 401

    def test_checkout_unknown_package(self, auth_headers):
        r = requests.post(f"{BASE}/payments/checkout/session",
                          json={"package_id": "bogus", "origin_url": "https://example.com"},
                          headers=auth_headers, timeout=15)
        assert r.status_code == 400

    def test_checkout_session_creation(self, auth_headers):
        r = requests.post(f"{BASE}/payments/checkout/session",
                          json={"package_id": "premium_monthly",
                                "origin_url": "https://cvforge.test"},
                          headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("https://")
        assert "stripe.com" in data["url"] or "checkout.stripe" in data["url"]
        TestPayments.session_id = data["session_id"]

    def test_checkout_status_owner(self, auth_headers):
        assert TestPayments.session_id
        r = requests.get(f"{BASE}/payments/checkout/status/{TestPayments.session_id}",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["status", "payment_status", "amount_total", "currency", "is_premium"]:
            assert k in data

    def test_checkout_status_not_owner(self, http):
        assert TestPayments.session_id
        email2 = f"other2_{uuid.uuid4().hex[:8]}@cvforge.dev"
        r = http.post(f"{BASE}/auth/register", json={
            "email": email2, "password": "TestPass123!", "full_name": "Autre2"
        }, timeout=15)
        token2 = r.json()["access_token"]
        r2 = requests.get(f"{BASE}/payments/checkout/status/{TestPayments.session_id}",
                          headers={"Authorization": f"Bearer {token2}"}, timeout=15)
        assert r2.status_code == 403

    def test_checkout_status_unknown_session(self, auth_headers):
        r = requests.get(f"{BASE}/payments/checkout/status/sess_unknown_xyz",
                         headers=auth_headers, timeout=15)
        assert r.status_code == 404


# ---------- Webhook ----------
class TestWebhook:
    def test_webhook_invalid_signature(self):
        # Invalid signature -> 400
        r = requests.post(f"{BASE}/webhook/stripe",
                          data=b'{"type":"checkout.session.completed"}',
                          headers={"Stripe-Signature": "t=1,v1=invalid",
                                   "Content-Type": "application/json"},
                          timeout=15)
        assert r.status_code == 400

    def test_webhook_no_signature(self):
        r = requests.post(f"{BASE}/webhook/stripe",
                          data=b'{}',
                          headers={"Content-Type": "application/json"},
                          timeout=15)
        assert r.status_code == 400
