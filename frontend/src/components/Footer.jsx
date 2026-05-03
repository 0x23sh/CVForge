import React from "react";
import { Square } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50 mt-20" data-testid="main-footer">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-[#002FA7] flex items-center justify-center">
                            <Square size={14} weight="fill" className="text-white" />
                        </div>
                        <span className="font-heading font-bold">CVForge</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        CV intelligents propulsés par l'IA, optimisés ATS, en quelques minutes.
                    </p>
                </div>
                <div>
                    <h4 className="label-eyebrow text-slate-500 mb-3">Produit</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/pricing" className="text-slate-700 hover:text-[#002FA7]">Tarifs</Link></li>
                        <li><Link to="/dashboard" className="text-slate-700 hover:text-[#002FA7]">Tableau de bord</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="label-eyebrow text-slate-500 mb-3">Compte</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/login" className="text-slate-700 hover:text-[#002FA7]">Connexion</Link></li>
                        <li><Link to="/register" className="text-slate-700 hover:text-[#002FA7]">Inscription</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="label-eyebrow text-slate-500 mb-3">Légal</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                        <li>Mentions légales</li>
                        <li>Confidentialité</li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} CVForge. Conçu avec précision.
            </div>
        </footer>
    );
}
