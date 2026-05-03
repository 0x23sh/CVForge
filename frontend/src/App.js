import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CVCreatePage from "@/pages/CVCreatePage";
import CVPreviewPage from "@/pages/CVPreviewPage";
import PricingPage from "@/pages/PricingPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
                    <Route path="/cv/new" element={<Protected><CVCreatePage /></Protected>} />
                    <Route path="/cv/:id" element={<Protected><CVPreviewPage /></Protected>} />
                    <Route path="/payment/success" element={<Protected><PaymentSuccessPage /></Protected>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
        </AuthProvider>
    );
}

export default App;
