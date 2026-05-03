import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        const token = localStorage.getItem("cvforge_token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch (e) {
            localStorage.removeItem("cvforge_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("cvforge_token", data.access_token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, password, full_name) => {
        const { data } = await api.post("/auth/register", { email, password, full_name });
        localStorage.setItem("cvforge_token", data.access_token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem("cvforge_token");
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);
