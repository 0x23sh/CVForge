import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api, { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DownloadSimple, Crown, ArrowLeft, Check } from "@phosphor-icons/react";

const TEMPLATE_ACCENTS = {
    minimal: "#0f172a",
    modern: "#002FA7",
    executive: "#7a1f1f",
    elegant: "#1f4d3a",
};

function CVDocument({ cv, accent }) {
    const o = cv.optimized || {};
    return (
        <div className="cv-paper p-10 max-w-[820px] mx-auto" style={{ minHeight: "1100px" }}>
            <h1 className="font-heading text-3xl font-bold tracking-tight" style={{ color: accent }}>
                {cv.full_name}
            </h1>
            <div className="text-base text-slate-600 mb-2">{cv.target_job}</div>
            <div className="text-xs text-slate-500 pb-3 border-b" style={{ borderColor: accent }}>
                {[cv.email, cv.phone, cv.location].filter(Boolean).join(" · ")}
            </div>

            {o.summary && (
                <section className="mt-5">
                    <h2 className="label-eyebrow mb-2" style={{ color: accent }}>Profil</h2>
                    <p className="text-sm text-slate-800 leading-relaxed">{o.summary}</p>
                </section>
            )}

            {o.experiences?.length > 0 && (
                <section className="mt-5">
                    <h2 className="label-eyebrow mb-2" style={{ color: accent }}>Expérience professionnelle</h2>
                    <div className="space-y-4">
                        {o.experiences.map((e, i) => (
                            <div key={i}>
                                <div className="font-bold text-slate-900 text-sm">{e.title}</div>
                                <div className="text-xs italic text-slate-500 mb-1">
                                    {[e.company, [e.start_date, e.end_date].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}
                                </div>
                                {e.bullets?.length > 0 && (
                                    <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside ml-1">
                                        {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {o.educations?.length > 0 && (
                <section className="mt-5">
                    <h2 className="label-eyebrow mb-2" style={{ color: accent }}>Formation</h2>
                    <div className="space-y-3">
                        {o.educations.map((e, i) => (
                            <div key={i}>
                                <div className="font-bold text-slate-900 text-sm">{e.degree}</div>
                                <div className="text-xs italic text-slate-500">
                                    {[e.school, [e.start_date, e.end_date].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}
                                </div>
                                {e.description && <div className="text-sm text-slate-700 mt-1">{e.description}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {o.skills?.length > 0 && (
                <section className="mt-5">
                    <h2 className="label-eyebrow mb-2" style={{ color: accent }}>Compétences</h2>
                    <div className="text-sm text-slate-800">{o.skills.join(" · ")}</div>
                </section>
            )}

            {o.languages?.length > 0 && (
                <section className="mt-5">
                    <h2 className="label-eyebrow mb-2" style={{ color: accent }}>Langues</h2>
                    <div className="text-sm text-slate-800">{o.languages.join(" · ")}</div>
                </section>
            )}
        </div>
    );
}

export default function CVPreviewPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const [cv, setCv] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const load = async () => {
        try {
            const [{ data: cvData }, { data: tpls }] = await Promise.all([
                api.get(`/cv/${id}`),
                api.get("/templates"),
            ]);
            setCv(cvData);
            setTemplates(tpls);
        } catch {
            toast.error("CV introuvable");
            nav("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    const changeTemplate = async (tplId) => {
        const tpl = templates.find((t) => t.id === tplId);
        if (tpl?.premium && !user?.is_premium) {
            toast.error("Modèle Premium - passez Premium pour y accéder");
            nav("/pricing");
            return;
        }
        try {
            await api.put(`/cv/${id}/template`, { template: tplId });
            setCv((c) => ({ ...c, template: tplId }));
            toast.success("Modèle mis à jour");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur");
        }
    };

    const downloadPDF = async () => {
        setDownloading(true);
        try {
            const token = localStorage.getItem("cvforge_token");
            const res = await fetch(`${API}/cv/${id}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("PDF generation failed");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `CV_${cv.full_name.replace(/\s+/g, "_")}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PDF téléchargé");
        } catch {
            toast.error("Erreur lors du téléchargement");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>;
    if (!cv) return null;

    const accent = TEMPLATE_ACCENTS[cv.template] || "#0f172a";
    const score = cv.optimized?.ats_score;

    return (
        <div className="min-h-screen bg-slate-100">
            <Navbar />
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-600 hover:text-[#002FA7] mb-4" data-testid="back-to-dashboard">
                    <ArrowLeft size={14} className="mr-1" /> Retour au tableau de bord
                </Link>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-200 p-6">
                            <div className="label-eyebrow text-slate-500 mb-2">Score ATS</div>
                            <div className="flex items-end gap-2 mb-3">
                                <div className="text-5xl font-heading font-bold text-[#002FA7]" data-testid="ats-score">{score ?? "—"}</div>
                                <div className="text-slate-400 mb-2">/100</div>
                            </div>
                            <div className="h-1.5 bg-slate-100 mb-4">
                                <div className="h-full bg-[#002FA7]" style={{ width: `${score || 0}%` }} />
                            </div>
                            {cv.optimized?.ats_keywords?.length > 0 && (
                                <>
                                    <div className="label-eyebrow text-slate-500 mb-2">Mots-clés détectés</div>
                                    <div className="flex flex-wrap gap-1">
                                        {cv.optimized.ats_keywords.slice(0, 10).map((k, i) => (
                                            <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5">{k}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white border border-slate-200 p-6">
                            <div className="label-eyebrow text-slate-500 mb-3">Modèle</div>
                            <div className="space-y-2">
                                {templates.map((t) => {
                                    const locked = t.premium && !user?.is_premium;
                                    const active = cv.template === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => changeTemplate(t.id)}
                                            className={`w-full flex items-center justify-between p-3 border text-sm transition-colors ${active ? "border-[#002FA7] bg-[#002FA7]/5" : "border-slate-200 hover:border-slate-400"}`}
                                            data-testid={`template-${t.id}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{t.name}</span>
                                                {t.premium && <Crown size={12} weight="fill" className="text-amber-500" />}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                {locked && <span className="text-xs text-amber-600 font-bold">Premium</span>}
                                                {active && <Check size={14} className="text-[#002FA7]" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            onClick={downloadPDF}
                            disabled={downloading}
                            className="w-full rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-12"
                            data-testid="download-pdf-btn"
                        >
                            <DownloadSimple size={16} className="mr-2" />
                            {downloading ? "Préparation..." : "Télécharger en PDF"}
                        </Button>
                    </aside>

                    {/* Preview */}
                    <main className="lg:col-span-8">
                        <CVDocument cv={cv} accent={accent} />
                    </main>
                </div>
            </div>
        </div>
    );
}
