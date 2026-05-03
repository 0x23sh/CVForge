import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Square, ArrowRight } from "@phosphor-icons/react";

export default function LoginPage() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success("Connexion réussie");
            nav("/dashboard");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden">
                <Link to="/" className="flex items-center gap-2 z-10 relative" data-testid="auth-logo">
                    <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center">
                        <Square size={16} weight="fill" className="text-white" />
                    </div>
                    <span className="font-heading text-xl font-bold">CVForge</span>
                </Link>
                <div className="relative z-10">
                    <h2 className="text-5xl font-heading font-bold tracking-tight mb-4">
                        Bienvenue à nouveau.
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                        Connectez-vous pour accéder à vos CV, en générer de nouveaux ou passer Premium.
                    </p>
                </div>
                <div className="text-xs text-slate-500 relative z-10">© CVForge — Précision suisse pour candidats exigeants.</div>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(135deg, transparent 49%, #002FA7 49%, #002FA7 51%, transparent 51%)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center">
                            <Square size={16} weight="fill" className="text-white" />
                        </div>
                        <span className="font-heading text-xl font-bold">CVForge</span>
                    </div>
                    <div className="label-eyebrow text-slate-500 mb-3">Connexion</div>
                    <h1 className="text-4xl font-heading font-bold tracking-tight text-slate-900 mb-2">Heureux de vous revoir.</h1>
                    <p className="text-slate-600 mb-8">Pas encore de compte ? <Link to="/register" className="text-[#002FA7] font-medium underline" data-testid="link-to-register">Créer un compte</Link></p>

                    <form onSubmit={submit} className="space-y-5" data-testid="login-form">
                        <div>
                            <Label htmlFor="email" className="label-eyebrow text-slate-500">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-2 rounded-none border-slate-300 h-11"
                                data-testid="login-email-input"
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
                                className="mt-2 rounded-none border-slate-300 h-11"
                                data-testid="login-password-input"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-none h-11 bg-[#002FA7] hover:bg-[#00227A] text-white"
                            data-testid="login-submit-btn"
                        >
                            {loading ? "Connexion..." : (<>Se connecter <ArrowRight size={16} className="ml-2" /></>)}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
