import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Persona } from "@/mock/data";
import { login as apiLogin, signup as apiSignup, getMe } from "@/api/auth";
import type { AuthUser } from "@/api/auth";

interface AuthContextType {
  persona: Persona | null;
  user: AuthUser | null;
  isInitializing: boolean;
  login: (persona: Persona, email: string, password: string) => Promise<void>;
  signup: (
    persona: Persona,
    name: string,
    email: string,
    password: string,
    wallet?: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsInitializing(false);
      return;
    }
    getMe()
      .then((u) => {
        setUser(u);
        setPersona(u.persona);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  const login = useCallback(async (_p: Persona, email: string, password: string) => {
    const { user: u, token } = await apiLogin(email, password);
    localStorage.setItem("token", token);
    setPersona(u.persona);
    setUser(u);
  }, []);

  const signup = useCallback(
    async (p: Persona, name: string, email: string, password: string, wallet?: string) => {
      const { user: u, token } = await apiSignup(name, email, password, p, wallet);
      localStorage.setItem("token", token);
      setPersona(u.persona);
      setUser(u);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setPersona(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ persona, user, isInitializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
