import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Spinner, Crown, ArrowRight } from "@phosphor-icons/react";

const POLL_INTERVAL = 2000;
const MAX_ATTEMPTS = 8;

export default function PaymentSuccessPage() {
    const [params] = useSearchParams();
    const { refresh } = useAuth();
    const [state, setState] = useState({ status: "checking", message: "Vérification du paiement..." });
    const attemptsRef = useRef(0);

    useEffect(() => {
        const sessionId = params.get("session_id");
        if (!sessionId) {
            setState({ status: "error", message: "Identifiant de session manquant" });
            return;
        }

        let timer;
        const poll = async () => {
            attemptsRef.current += 1;
            try {
                const { data } = await api.get(`/payments/checkout/status/${sessionId}`);
                if (data.payment_status === "paid") {
                    await refresh();
                    setState({ status: "success", message: "Paiement réussi !" });
                    return;
                }
                if (data.status === "expired") {
                    setState({ status: "error", message: "Session de paiement expirée" });
                    return;
                }
                if (attemptsRef.current >= MAX_ATTEMPTS) {
                    setState({ status: "error", message: "Délai dépassé. Vérifiez votre email." });
                    return;
                }
                timer = setTimeout(poll, POLL_INTERVAL);
            } catch (e) {
                if (attemptsRef.current >= MAX_ATTEMPTS) {
                    setState({ status: "error", message: "Erreur de vérification" });
                    return;
                }
                timer = setTimeout(poll, POLL_INTERVAL);
            }
        };
        poll();
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 lg:px-8 py-20">
                <div className="bg-white border border-slate-200 p-12 text-center" data-testid="payment-status-card">
                    {state.status === "checking" && (
                        <>
                            <Spinner size={64} className="mx-auto text-[#002FA7] animate-spin mb-6" />
                            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-3">Vérification...</h1>
                            <p className="text-slate-600">{state.message}</p>
                        </>
                    )}
                    {state.status === "success" && (
                        <>
                            <CheckCircle size={72} weight="duotone" className="mx-auto text-emerald-600 mb-6" />
                            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-amber-800">
                                <Crown size={12} weight="fill" /> Premium activé
                            </div>
                            <h1 className="text-4xl font-heading font-bold tracking-tight text-slate-900 mb-3">Bienvenue dans le club Premium.</h1>
                            <p className="text-slate-600 mb-8">CV illimités. Modèles débloqués. Optimisation ATS avancée.</p>
                            <Link to="/dashboard">
                                <Button className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-12 px-8" data-testid="success-dashboard-btn">
                                    Aller au tableau de bord <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </Link>
                        </>
                    )}
                    {state.status === "error" && (
                        <>
                            <XCircle size={72} weight="duotone" className="mx-auto text-red-600 mb-6" />
                            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-3">Un problème est survenu</h1>
                            <p className="text-slate-600 mb-8">{state.message}</p>
                            <Link to="/pricing">
                                <Button variant="outline" className="rounded-none border-slate-300 h-12" data-testid="success-retry-btn">
                                    Retour aux tarifs
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
