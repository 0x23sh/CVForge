import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash, ArrowRight, ArrowLeft, Sparkle } from "@phosphor-icons/react";

const STEPS = ["Profil", "Expériences", "Formations", "Compétences", "Poste cible"];

export default function CVCreatePage() {
    const nav = useNavigate();
    const { refresh } = useAuth();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const [data, setData] = useState({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        target_job: "",
        summary: "",
        experiences: [{ title: "", company: "", start_date: "", end_date: "", description: "" }],
        educations: [{ degree: "", school: "", start_date: "", end_date: "", description: "" }],
        skills: "",
        languages: "",
    });

    const set = (k, v) => setData((s) => ({ ...s, [k]: v }));

    const updateArr = (key, idx, field, val) => {
        setData((s) => {
            const arr = [...s[key]];
            arr[idx] = { ...arr[idx], [field]: val };
            return { ...s, [key]: arr };
        });
    };
    const addItem = (key, blank) => setData((s) => ({ ...s, [key]: [...s[key], blank] }));
    const removeItem = (key, idx) =>
        setData((s) => ({ ...s, [key]: s[key].filter((_, i) => i !== idx) }));

    const next = () => {
        if (step === 0 && (!data.full_name || !data.email)) {
            toast.error("Nom et email requis");
            return;
        }
        if (step === 4 && !data.target_job) {
            toast.error("Poste cible requis");
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };
    const prev = () => setStep((s) => Math.max(s - 1, 0));

    const submit = async () => {
        if (!data.target_job) {
            toast.error("Poste cible requis");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...data,
                skills: data.skills.split(",").map((x) => x.trim()).filter(Boolean),
                languages: data.languages.split(",").map((x) => x.trim()).filter(Boolean),
                experiences: data.experiences.filter((e) => e.title || e.company),
                educations: data.educations.filter((e) => e.degree || e.school),
                template: "minimal",
            };
            const { data: cv } = await api.post("/cv/generate", payload);
            await refresh();
            toast.success("CV généré avec succès");
            nav(`/cv/${cv.id}`);
        } catch (err) {
            const detail = err?.response?.data?.detail || "Erreur lors de la génération";
            toast.error(detail);
            if (err?.response?.status === 402) nav("/pricing");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
                <div className="label-eyebrow text-slate-500 mb-2">Étape {step + 1}/{STEPS.length}</div>
                <h1 className="text-4xl lg:text-5xl font-heading font-bold tracking-tight text-slate-900 mb-2" data-testid="create-title">{STEPS[step]}</h1>
                <p className="text-slate-600 mb-8">Renseignez vos informations. L'IA optimisera le rendu final.</p>

                {/* Progress */}
                <div className="flex gap-1 mb-10">
                    {STEPS.map((s, i) => (
                        <div key={s} className={`flex-1 h-1 ${i <= step ? "bg-[#002FA7]" : "bg-slate-200"}`} />
                    ))}
                </div>

                <div className="bg-white border border-slate-200 p-8">
                    {step === 0 && (
                        <div className="space-y-5" data-testid="step-profile">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <Label className="label-eyebrow text-slate-500">Nom complet *</Label>
                                    <Input value={data.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-2 rounded-none border-slate-300 h-11" data-testid="input-fullname" />
                                </div>
                                <div>
                                    <Label className="label-eyebrow text-slate-500">Email *</Label>
                                    <Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className="mt-2 rounded-none border-slate-300 h-11" data-testid="input-email" />
                                </div>
                                <div>
                                    <Label className="label-eyebrow text-slate-500">Téléphone</Label>
                                    <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} className="mt-2 rounded-none border-slate-300 h-11" data-testid="input-phone" />
                                </div>
                                <div>
                                    <Label className="label-eyebrow text-slate-500">Ville</Label>
                                    <Input value={data.location} onChange={(e) => set("location", e.target.value)} className="mt-2 rounded-none border-slate-300 h-11" data-testid="input-location" />
                                </div>
                            </div>
                            <div>
                                <Label className="label-eyebrow text-slate-500">Résumé / Pitch (optionnel)</Label>
                                <Textarea
                                    value={data.summary}
                                    onChange={(e) => set("summary", e.target.value)}
                                    rows={3}
                                    placeholder="Quelques phrases sur votre profil. L'IA s'occupera du reste."
                                    className="mt-2 rounded-none border-slate-300"
                                    data-testid="input-summary"
                                />
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5" data-testid="step-experiences">
                            {data.experiences.map((exp, i) => (
                                <div key={i} className="border border-slate-200 p-5 bg-slate-50 relative">
                                    {data.experiences.length > 1 && (
                                        <button
                                            onClick={() => removeItem("experiences", i)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                                            data-testid={`exp-remove-${i}`}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Poste</Label>
                                            <Input value={exp.title} onChange={(e) => updateArr("experiences", i, "title", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`exp-title-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Entreprise</Label>
                                            <Input value={exp.company} onChange={(e) => updateArr("experiences", i, "company", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`exp-company-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Début</Label>
                                            <Input placeholder="2021" value={exp.start_date} onChange={(e) => updateArr("experiences", i, "start_date", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`exp-start-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Fin</Label>
                                            <Input placeholder="présent" value={exp.end_date} onChange={(e) => updateArr("experiences", i, "end_date", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`exp-end-${i}`} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Label className="label-eyebrow text-slate-500">Missions / Réalisations</Label>
                                        <Textarea value={exp.description} onChange={(e) => updateArr("experiences", i, "description", e.target.value)} rows={3} className="mt-2 rounded-none border-slate-300 bg-white" data-testid={`exp-desc-${i}`} />
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => addItem("experiences", { title: "", company: "", start_date: "", end_date: "", description: "" })}
                                className="rounded-none border-dashed border-slate-300 w-full"
                                data-testid="exp-add"
                            >
                                <Plus size={14} className="mr-2" /> Ajouter une expérience
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5" data-testid="step-educations">
                            {data.educations.map((ed, i) => (
                                <div key={i} className="border border-slate-200 p-5 bg-slate-50 relative">
                                    {data.educations.length > 1 && (
                                        <button
                                            onClick={() => removeItem("educations", i)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                                            data-testid={`edu-remove-${i}`}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Diplôme</Label>
                                            <Input value={ed.degree} onChange={(e) => updateArr("educations", i, "degree", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`edu-degree-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">École / Université</Label>
                                            <Input value={ed.school} onChange={(e) => updateArr("educations", i, "school", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`edu-school-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Début</Label>
                                            <Input value={ed.start_date} onChange={(e) => updateArr("educations", i, "start_date", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`edu-start-${i}`} />
                                        </div>
                                        <div>
                                            <Label className="label-eyebrow text-slate-500">Fin</Label>
                                            <Input value={ed.end_date} onChange={(e) => updateArr("educations", i, "end_date", e.target.value)} className="mt-2 rounded-none border-slate-300 h-10 bg-white" data-testid={`edu-end-${i}`} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Label className="label-eyebrow text-slate-500">Description</Label>
                                        <Textarea value={ed.description} onChange={(e) => updateArr("educations", i, "description", e.target.value)} rows={2} className="mt-2 rounded-none border-slate-300 bg-white" data-testid={`edu-desc-${i}`} />
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => addItem("educations", { degree: "", school: "", start_date: "", end_date: "", description: "" })}
                                className="rounded-none border-dashed border-slate-300 w-full"
                                data-testid="edu-add"
                            >
                                <Plus size={14} className="mr-2" /> Ajouter une formation
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5" data-testid="step-skills">
                            <div>
                                <Label className="label-eyebrow text-slate-500">Compétences (séparées par des virgules)</Label>
                                <Textarea
                                    value={data.skills}
                                    onChange={(e) => set("skills", e.target.value)}
                                    rows={3}
                                    placeholder="React, TypeScript, Figma, Gestion de projet, SEO..."
                                    className="mt-2 rounded-none border-slate-300"
                                    data-testid="input-skills"
                                />
                            </div>
                            <div>
                                <Label className="label-eyebrow text-slate-500">Langues</Label>
                                <Textarea
                                    value={data.languages}
                                    onChange={(e) => set("languages", e.target.value)}
                                    rows={2}
                                    placeholder="Français (natif), Anglais (C1), Espagnol (B2)"
                                    className="mt-2 rounded-none border-slate-300"
                                    data-testid="input-languages"
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-5" data-testid="step-target">
                            <div>
                                <Label className="label-eyebrow text-slate-500">Poste cible *</Label>
                                <Input
                                    value={data.target_job}
                                    onChange={(e) => set("target_job", e.target.value)}
                                    placeholder="Ex : Développeur Full-Stack Senior"
                                    className="mt-2 rounded-none border-slate-300 h-11"
                                    data-testid="input-target-job"
                                />
                                <p className="text-xs text-slate-500 mt-2">L'IA adaptera le ton et les mots-clés à ce poste.</p>
                            </div>
                            <div className="border border-[#002FA7]/20 bg-[#002FA7]/5 p-5 flex items-start gap-3">
                                <Sparkle size={20} weight="fill" className="text-[#002FA7] mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-slate-700">
                                    <strong className="text-[#002FA7]">Prêt pour la magie</strong>
                                    <p className="mt-1 text-slate-600">GPT-5.2 va réécrire votre profil, transformer vos missions en réalisations chiffrées et calculer votre score ATS. Ça prend ~30 secondes.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={prev}
                        disabled={step === 0}
                        className="rounded-none border-slate-300 h-11"
                        data-testid="step-prev-btn"
                    >
                        <ArrowLeft size={14} className="mr-2" /> Retour
                    </Button>
                    {step < STEPS.length - 1 ? (
                        <Button onClick={next} className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-11" data-testid="step-next-btn">
                            Suivant <ArrowRight size={14} className="ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={submit}
                            disabled={submitting}
                            className="rounded-none bg-[#002FA7] hover:bg-[#00227A] text-white h-11"
                            data-testid="generate-cv-btn"
                        >
                            {submitting ? "Génération en cours..." : (<><Sparkle size={14} className="mr-2" weight="fill" /> Générer mon CV</>)}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
