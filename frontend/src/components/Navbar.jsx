import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Square, SignOut, UserCircle, Crown } from "@phosphor-icons/react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const nav = useNavigate();

    return (
        <header className="glass-header sticky top-0 z-50" data-testid="main-navbar">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 group" data-testid="navbar-logo">
                        <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center transition-transform group-hover:rotate-90 duration-500">
                            <Square size={16} weight="fill" className="text-white" />
                        </div>
                        <span className="font-heading text-xl font-bold tracking-tight">CVForge</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-sm font-medium text-slate-700 hover:text-[#002FA7] transition-colors" data-testid="nav-home">Accueil</Link>
                        <Link to="/pricing" className="text-sm font-medium text-slate-700 hover:text-[#002FA7] transition-colors" data-testid="nav-pricing">Tarifs</Link>
                        {user && (
                            <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-[#002FA7] transition-colors" data-testid="nav-dashboard">Tableau de bord</Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {user.is_premium && (
                                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1" data-testid="badge-premium">
                                        <Crown size={12} weight="fill" /> Premium
                                    </span>
                                )}
                                <span className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                                    <UserCircle size={20} />
                                    {user.full_name}
                                </span>
                                <Button
                                    onClick={() => { logout(); nav("/"); }}
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-none"
                                    data-testid="navbar-logout-btn"
                                >
                                    <SignOut size={16} className="mr-1" /> Déconnexion
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm" className="rounded-none" data-testid="navbar-login-btn">Connexion</Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm" className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white" data-testid="navbar-register-btn">
                                        Commencer
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
