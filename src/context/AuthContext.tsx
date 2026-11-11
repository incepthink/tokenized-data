import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Persona } from "@/mock/data";
import { login as apiLogin, signup as apiSignup, getMe } from "@/api/auth";
import type { AuthUser } from "@/api/auth";
import {
  clearVaultSecret,
  deriveVaultSecret,
  loadVaultSecret,
  storeVaultSecret,
  vaultIdFromPk,
  vaultPkFromSecret,
} from "@/lib/midnight/identity";

interface AuthContextType {
  persona: Persona | null;
  user: AuthUser | null;
  isInitializing: boolean;
  /** This account's on-chain identity (public half of the vault key), once loaded. */
  vaultId: string | null;
  /** True when the account was created before on-chain identities and cannot transact. */
  isLegacyAccount: boolean;
  login: (persona: Persona, email: string, password: string) => Promise<void>;
  signup: (
    persona: Persona,
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [vaultId, setVaultId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsInitializing(false);
      return;
    }
    getMe()
      .then(async (u) => {
        // The vault key only exists in this browser. Without it the session
        // cannot prove anything, so ask the user to log in again.
        const secret = loadVaultSecret();
        if (!secret) {
          localStorage.removeItem("token");
          return;
        }
        setVaultId(vaultIdFromPk(await vaultPkFromSecret(secret)));
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
    const secret = await deriveVaultSecret(email, password);
    storeVaultSecret(secret);
    setVaultId(vaultIdFromPk(await vaultPkFromSecret(secret)));
    localStorage.setItem("token", token);
    setPersona(u.persona);
    setUser(u);
  }, []);

  const signup = useCallback(
    async (p: Persona, name: string, email: string, password: string) => {
      // The account's wallet field is its vault id: the public key the
      // Midnight contract knows this user by.
      const secret = await deriveVaultSecret(email, password);
      const id = vaultIdFromPk(await vaultPkFromSecret(secret));
      const { user: u, token } = await apiSignup(name, email, password, p, id);
      storeVaultSecret(secret);
      setVaultId(id);
      localStorage.setItem("token", token);
      setPersona(u.persona);
      setUser(u);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    clearVaultSecret();
    setVaultId(null);
    setPersona(null);
    setUser(null);
  }, []);

  const isLegacyAccount = !!user && !!vaultId && user.wallet !== vaultId;

  return (
    <AuthContext.Provider value={{ persona, user, isInitializing, vaultId, isLegacyAccount, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
