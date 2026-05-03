import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Check,
    Sparkle,
    Lightning,
    Target,
    FileText,
    ChartLineUp,
    Crown,
} from "@phosphor-icons/react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="relative overflow-hidden border-b border-slate-200" data-testid="hero-section">
                <div className="absolute inset-0 grain" />
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04] pointer-events-none">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(45deg, transparent 49%, #002FA7 49%, #002FA7 51%, transparent 51%)',
                        backgroundSize: '20px 20px'
                    }} />
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 relative">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-xs font-bold tracking-[0.2em] uppercase mb-6" data-testid="hero-eyebrow">
                                <Sparkle size={12} weight="fill" className="text-[#002FA7]" />
                                Propulsé par GPT-5.2
                            </div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-tight leading-[0.95] text-slate-900 mb-6">
                                Le CV qui passe<br />
                                les filtres ATS,<br />
                                <span className="text-[#002FA7]">en 2 minutes.</span>
                            </h1>
                            <p className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
                                Entrez vos infos, choisissez votre poste cible. Notre IA réécrit, optimise et adapte votre CV pour les recruteurs et leurs robots.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to="/register">
                                    <Button size="lg" className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white px-8 h-12" data-testid="hero-cta-primary">
                                        Créer mon CV gratuitement
                                        <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/pricing">
                                    <Button size="lg" variant="outline" className="rounded-none border-slate-300 h-12 px-8" data-testid="hero-cta-secondary">
                                        Voir les tarifs
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 mt-8 text-sm text-slate-600">
                                <span className="flex items-center gap-1.5"><Check size={14} weight="bold" className="text-[#002FA7]" /> 1 CV gratuit</span>
                                <span className="flex items-center gap-1.5"><Check size={14} weight="bold" className="text-[#002FA7]" /> Sans carte bancaire</span>
                                <span className="flex items-center gap-1.5"><Check size={14} weight="bold" className="text-[#002FA7]" /> Export PDF</span>
                            </div>
                        </div>

                        {/* Right side card preview */}
                        <div className="lg:col-span-5 relative">
                            <div className="absolute -top-4 -left-4 w-full h-full bg-[#002FA7]/5 border border-[#002FA7]/20" />
                            <div className="relative cv-paper p-8 rounded-none">
                                <div className="text-xs label-eyebrow text-slate-400 mb-2">CV Aperçu</div>
                                <div className="text-2xl font-heading font-bold text-slate-900">Marie Dubois</div>
                                <div className="text-sm text-slate-600 mb-3">Cheffe de Projet Digital</div>
                                <div className="text-xs text-slate-500 mb-4 border-b border-slate-200 pb-3">marie.dubois@email.com · +33 6 12 34 56 78 · Paris</div>
                                <div className="text-xs label-eyebrow text-[#002FA7] mb-2">Profil</div>
                                <p className="text-xs text-slate-700 leading-relaxed mb-4">
                                    Cheffe de projet certifiée PMP avec 7 ans d'expérience pilotant des transformations digitales B2B. Expertise Agile/Scrum et budgets &gt;1M€.
                                </p>
                                <div className="text-xs label-eyebrow text-[#002FA7] mb-2">Expérience</div>
                                <div className="text-xs font-bold text-slate-900">Cheffe de projet senior</div>
                                <div className="text-xs italic text-slate-500 mb-2">Acme Corp · 2021 — présent</div>
                                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                                    <li>Augmentation du NPS de 32 points en 18 mois</li>
                                    <li>Pilotage de 12 squads Agile sur 4 produits</li>
                                </ul>
                                <div className="absolute -bottom-3 -right-3 bg-[#002FA7] text-white px-3 py-1 text-xs font-bold tracking-wider uppercase">
                                    Score ATS : 94
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features bento */}
            <section className="py-24 border-b border-slate-200" data-testid="features-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-2xl mb-12">
                        <div className="label-eyebrow text-slate-500 mb-3">Fonctionnalités</div>
                        <h2 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight text-slate-900">
                            Tout ce qu'il faut pour décrocher l'entretien.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-12 gap-6">
                        <div className="md:col-span-7 border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 bg-white">
                            <Lightning size={32} weight="duotone" className="text-[#002FA7] mb-4" />
                            <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">IA générative dernière génération</h3>
                            <p className="text-slate-600 leading-relaxed">
                                GPT-5.2 réécrit chaque section pour la rendre concrète, mesurable et alignée sur le poste visé.
                            </p>
                        </div>
                        <div className="md:col-span-5 border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 bg-slate-950 text-white">
                            <Target size={32} weight="duotone" className="text-blue-300 mb-4" />
                            <h3 className="text-2xl font-heading font-bold mb-2">Optimisation ATS</h3>
                            <p className="text-slate-300 leading-relaxed">
                                Mots-clés ciblés pour passer Workday, Lever, Greenhouse et tous les autres robots.
                            </p>
                        </div>
                        <div className="md:col-span-4 border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 bg-white">
                            <FileText size={32} weight="duotone" className="text-[#002FA7] mb-4" />
                            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Modèles élégants</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Minimal, Moderne, Executive, Élégant. Export PDF haute qualité.
                            </p>
                        </div>
                        <div className="md:col-span-4 border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 bg-white">
                            <ChartLineUp size={32} weight="duotone" className="text-[#002FA7] mb-4" />
                            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Score ATS visible</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Sachez instantanément si votre CV passera les filtres automatiques.
                            </p>
                        </div>
                        <div className="md:col-span-4 border border-slate-200 p-8 hover:-translate-y-1 transition-transform duration-300 bg-[#002FA7] text-white">
                            <Crown size={32} weight="duotone" className="text-amber-300 mb-4" />
                            <h3 className="text-xl font-heading font-bold mb-2">Premium 9,99€</h3>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                CV illimités, modèles premium, optimisation avancée. Paiement unique.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-slate-50" data-testid="how-it-works-section">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="label-eyebrow text-slate-500 mb-3">Trois étapes</div>
                    <h2 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight text-slate-900 mb-12 max-w-2xl">
                        De zéro à CV optimisé.<br/>En moins de cinq minutes.
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { n: "01", t: "Renseignez vos infos", d: "Expériences, formations, compétences. Aucun talent rédactionnel requis." },
                            { n: "02", t: "Choisissez le poste cible", d: "L'IA adapte le ton, les mots-clés et la mise en avant des résultats." },
                            { n: "03", t: "Téléchargez votre PDF", d: "Modèle au choix. Format ATS-friendly. Prêt à postuler." },
                        ].map((s) => (
                            <div key={s.n} className="bg-white border border-slate-200 p-8" data-testid={`step-${s.n}`}>
                                <div className="font-mono text-5xl font-bold text-[#002FA7]/20 mb-4">{s.n}</div>
                                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">{s.t}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 bg-slate-950 text-white" data-testid="cta-section">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                    <h2 className="text-4xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
                        Le CV qui vous ressemble,<br/>amplifié par l'IA.
                    </h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                        Premier CV gratuit. Aucun engagement. Téléchargement immédiat.
                    </p>
                    <Link to="/register">
                        <Button size="lg" className="rounded-none bg-white hover:bg-slate-100 text-slate-900 px-8 h-12" data-testid="cta-final-btn">
                            Démarrer maintenant
                            <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
