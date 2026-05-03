import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Crown, ArrowRight, X } from "@phosphor-icons/react";

const FREE = {
    name: "Gratuit",
    price: "0€",
    desc: "Pour tester l'expérience.",
    features: [
        { ok: true, t: "1 CV généré par IA" },
        { ok: true, t: "Modèles Minimal & Moderne" },
        { ok: true, t: "Export PDF" },
        { ok: true, t: "Score ATS" },
        { ok: false, t: "CV illimités" },
        { ok: false, t: "Modèles Premium" },
        { ok: false, t: "Optimisation avancée" },
    ],
    cta: "Plan actuel",
    primary: false,
};

const PREMIUM = {
    name: "Premium",
    price: "9,99€",
    priceSuffix: "paiement unique",
    desc: "Pour les chercheurs d'emploi sérieux.",
    features: [
        { ok: true, t: "CV illimités" },
        { ok: true, t: "Tous les modèles (Executive, Élégant)" },
        { ok: true, t: "Optimisation ATS avancée GPT-5.2" },
        { ok: true, t: "Mots-clés sectoriels" },
        { ok: true, t: "Support prioritaire" },
        { ok: true, t: "Export PDF haute qualité" },
        { ok: true, t: "Score ATS détaillé" },
    ],
    cta: "Passer Premium",
    primary: true,
};

export default function PricingPage() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [loading, setLoading] = useState(false);

    const upgrade = async () => {
        if (!user) {
            nav("/register");
            return;
        }
        if (user.is_premium) {
            toast.info("Vous êtes déjà Premium");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post("/payments/checkout/session", {
                package_id: "premium_monthly",
                origin_url: window.location.origin,
            });
            window.location.href = data.url;
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur de paiement");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <section className="border-b border-slate-200 py-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                    <div className="label-eyebrow text-slate-500 mb-3">Tarifs simples</div>
                    <h1 className="text-5xl lg:text-6xl font-heading font-bold tracking-tight text-slate-900 mb-6">
                        Un prix juste,<br />pas d'abonnement caché.
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Commencez gratuitement, passez à Premium quand vous voulez. Paiement unique, accès à vie.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-5xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-6">
                    {[FREE, PREMIUM].map((p) => (
                        <div
                            key={p.name}
                            className={`relative bg-white p-8 transition-all duration-300 hover:-translate-y-1 ${p.primary ? "border-2 border-[#002FA7] shadow-lg" : "border border-slate-200"}`}
                            data-testid={`plan-${p.name.toLowerCase()}`}
                        >
                            {p.primary && (
                                <div className="absolute -top-3 left-8 bg-[#002FA7] text-white text-xs font-bold tracking-[0.2em] uppercase px-3 py-1">
                                    Recommandé
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                {p.primary && <Crown size={20} weight="fill" className="text-amber-500" />}
                                <h3 className="text-2xl font-heading font-bold text-slate-900">{p.name}</h3>
                            </div>
                            <p className="text-slate-600 text-sm mb-6">{p.desc}</p>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-heading font-bold text-slate-900">{p.price}</span>
                                {p.priceSuffix && <span className="text-sm text-slate-500">{p.priceSuffix}</span>}
                            </div>

                            <ul className="space-y-3 mb-8">
                                {p.features.map((f, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-sm ${f.ok ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                        {f.ok ? (
                                            <Check size={16} weight="bold" className="text-[#002FA7] mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <X size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span>{f.t}</span>
                                    </li>
                                ))}
                            </ul>

                            {p.name === "Gratuit" ? (
                                <Button
                                    disabled={true}
                                    variant="outline"
                                    className="w-full rounded-none border-slate-300 h-11"
                                    data-testid="plan-free-cta"
                                >
                                    {user ? "Plan actuel" : "Commencer gratuitement"}
                                </Button>
                            ) : (
                                <Button
                                    onClick={upgrade}
                                    disabled={loading || user?.is_premium}
                                    className="w-full rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-11"
                                    data-testid="plan-premium-cta"
                                >
                                    {user?.is_premium ? "Premium actif" : loading ? "Redirection..." : (<>{p.cta} <ArrowRight size={14} className="ml-2" /></>)}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="max-w-2xl mx-auto text-center mt-12 text-sm text-slate-500">
                    Paiement sécurisé via Stripe. Aucune donnée bancaire stockée chez nous.
                </div>
            </section>
            <Footer />
        </div>
    );
}
