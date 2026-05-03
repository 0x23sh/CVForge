import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Square, ArrowRight, Check } from "@phosphor-icons/react";

export default function RegisterPage() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error("Le mot de passe doit contenir au moins 6 caractères");
            return;
        }
        setLoading(true);
        try {
            await register(email, password, fullName);
            toast.success("Compte créé. Bienvenue !");
            nav("/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-[#002FA7] text-white p-12 flex-col justify-between relative overflow-hidden">
                <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="auth-logo">
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                        <Square size={16} weight="fill" className="text-[#002FA7]" />
                    </div>
                    <span className="font-heading text-xl font-bold">CVForge</span>
                </Link>
                <div className="relative z-10">
                    <h2 className="text-5xl font-heading font-bold tracking-tight mb-6 leading-tight">
                        Votre prochain entretien commence ici.
                    </h2>
                    <ul className="space-y-3 text-blue-100 max-w-md">
                        {["1 CV gratuit, sans carte bancaire", "Optimisé ATS par GPT-5.2", "Export PDF en un clic", "Modèles professionnels"].map((it) => (
                            <li key={it} className="flex items-start gap-2">
                                <Check size={20} weight="bold" className="mt-0.5 flex-shrink-0" />
                                <span>{it}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="text-xs text-blue-200 relative z-10">Plus de 0 — soyez le premier à essayer.</div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center">
                            <Square size={16} weight="fill" className="text-white" />
                        </div>
                        <span className="font-heading text-xl font-bold">CVForge</span>
                    </div>
                    <div className="label-eyebrow text-slate-500 mb-3">Inscription</div>
                    <h1 className="text-4xl font-heading font-bold tracking-tight text-slate-900 mb-2">Créez votre compte.</h1>
                    <p className="text-slate-600 mb-8">Déjà inscrit ? <Link to="/login" className="text-[#002FA7] font-medium underline" data-testid="link-to-login">Se connecter</Link></p>

                    <form onSubmit={submit} className="space-y-5" data-testid="register-form">
                        <div>
                            <Label htmlFor="full_name" className="label-eyebrow text-slate-500">Nom complet</Label>
                            <Input
                                id="full_name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="mt-2 rounded-none border-slate-300 h-11"
                                data-testid="register-fullname-input"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email" className="label-eyebrow text-slate-500">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-2 rounded-none border-slate-300 h-11"
                                data-testid="register-email-input"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="label-eyebrow text-slate-500">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="mt-2 rounded-none border-slate-300 h-11"
                                data-testid="register-password-input"
                            />
                            <p className="text-xs text-slate-500 mt-1">Au moins 6 caractères</p>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-none h-11 bg-[#002FA7] hover:bg-[#00227A] text-white"
                            data-testid="register-submit-btn"
                        >
                            {loading ? "Création..." : (<>Créer mon compte <ArrowRight size={16} className="ml-2" /></>)}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
