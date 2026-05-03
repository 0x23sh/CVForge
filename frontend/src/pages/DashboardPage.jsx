import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, FileText, Trash, ArrowRight, Crown, Sparkle } from "@phosphor-icons/react";

export default function DashboardPage() {
    const { user, refresh } = useAuth();
    const [cvs, setCvs] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    const load = async () => {
        try {
            const { data } = await api.get("/cv/list");
            setCvs(data);
        } catch (e) {
            toast.error("Impossible de charger les CV");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const remove = async (id) => {
        if (!window.confirm("Supprimer ce CV ?")) return;
        try {
            await api.delete(`/cv/${id}`);
            setCvs((s) => s.filter((c) => c.id !== id));
            toast.success("CV supprimé");
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    };

    const limitReached = !user?.is_premium && (user?.cvs_generated || 0) >= 1;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="label-eyebrow text-slate-500 mb-2">Tableau de bord</div>
                        <h1 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight text-slate-900" data-testid="dashboard-title">
                            Bonjour, {user?.full_name?.split(" ")[0]}.
                        </h1>
                        <p className="text-slate-600 mt-2">
                            {user?.is_premium ? "Plan Premium actif — CV illimités." : `${user?.cvs_generated || 0}/1 CV généré (plan gratuit)`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!user?.is_premium && (
                            <Link to="/pricing">
                                <Button variant="outline" className="rounded-none border-slate-300 h-11" data-testid="dashboard-upgrade-btn">
                                    <Crown size={16} className="mr-2 text-amber-600" /> Passer Premium
                                </Button>
                            </Link>
                        )}
                        <Button
                            onClick={() => limitReached ? nav("/pricing") : nav("/cv/new")}
                            className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-11"
                            data-testid="dashboard-new-cv-btn"
                        >
                            <Plus size={16} className="mr-2" /> Nouveau CV
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <div className="border border-slate-200 bg-white p-6">
                        <div className="label-eyebrow text-slate-500 mb-2">CV créés</div>
                        <div className="text-4xl font-heading font-bold text-slate-900" data-testid="stat-cv-count">{cvs.length}</div>
                    </div>
                    <div className="border border-slate-200 bg-white p-6">
                        <div className="label-eyebrow text-slate-500 mb-2">Plan</div>
                        <div className="text-4xl font-heading font-bold text-slate-900" data-testid="stat-plan">
                            {user?.is_premium ? "Premium" : "Gratuit"}
                        </div>
                    </div>
                    <div className="border border-slate-200 bg-slate-950 text-white p-6 relative overflow-hidden">
                        <Sparkle size={48} weight="duotone" className="absolute -right-4 -bottom-4 text-blue-400/20" />
                        <div className="label-eyebrow text-slate-400 mb-2">IA</div>
                        <div className="text-2xl font-heading font-bold">GPT-5.2</div>
                        <div className="text-sm text-slate-300">Optimisation ATS active</div>
                    </div>
                </div>

                {limitReached && (
                    <div className="border border-amber-200 bg-amber-50 p-6 mb-8 flex items-start justify-between gap-4" data-testid="limit-banner">
                        <div>
                            <div className="font-heading font-bold text-amber-900 mb-1">Limite gratuite atteinte</div>
                            <p className="text-sm text-amber-800">Passez à Premium pour générer des CV illimités et débloquer les modèles avancés.</p>
                        </div>
                        <Link to="/pricing">
                            <Button className="rounded-none bg-amber-600 hover:bg-amber-700 text-white" data-testid="limit-upgrade-btn">
                                Voir les plans
                            </Button>
                        </Link>
                    </div>
                )}

                {/* CV list */}
                <div className="mb-4">
                    <h2 className="text-2xl font-heading font-bold tracking-tight text-slate-900">Vos CV</h2>
                </div>

                {loading ? (
                    <div className="text-slate-500 py-12 text-center">Chargement...</div>
                ) : cvs.length === 0 ? (
                    <div className="border border-dashed border-slate-300 bg-white p-12 text-center" data-testid="empty-state">
                        <FileText size={48} weight="duotone" className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Aucun CV pour l'instant</h3>
                        <p className="text-slate-600 mb-6">Lancez votre premier CV en moins de 5 minutes.</p>
                        <Button onClick={() => nav("/cv/new")} className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white" data-testid="empty-create-btn">
                            <Plus size={16} className="mr-2" /> Créer mon premier CV
                        </Button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cvs.map((cv) => (
                            <div key={cv.id} className="border border-slate-200 bg-white p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group" data-testid={`cv-card-${cv.id}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 bg-[#002FA7] flex items-center justify-center">
                                        <FileText size={18} weight="fill" className="text-white" />
                                    </div>
                                    <button
                                        onClick={() => remove(cv.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                        data-testid={`cv-delete-${cv.id}`}
                                        aria-label="Supprimer"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                                <div className="label-eyebrow text-slate-500 mb-1">{cv.template}</div>
                                <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">{cv.full_name}</h3>
                                <p className="text-sm text-slate-600 mb-4">→ {cv.target_job}</p>
                                {cv.optimized?.ats_score != null && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="label-eyebrow text-slate-500">Score ATS</span>
                                            <span className="font-bold text-[#002FA7]">{cv.optimized.ats_score}/100</span>
                                        </div>
                                        <div className="h-1 bg-slate-100">
                                            <div className="h-full bg-[#002FA7]" style={{ width: `${cv.optimized.ats_score}%` }} />
                                        </div>
                                    </div>
                                )}
                                <Link to={`/cv/${cv.id}`}>
                                    <Button variant="ghost" className="w-full rounded-none border border-slate-200 group-hover:border-[#002FA7] group-hover:text-[#002FA7]" data-testid={`cv-open-${cv.id}`}>
                                        Ouvrir <ArrowRight size={14} className="ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
