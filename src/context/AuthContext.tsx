import React, { createContext, useContext, useState, useCallback } from "react";
import { Persona, MOCK_USERS } from "@/mock/data";

interface User {
  id: string;
  name: string;
  email: string;
  wallet?: string;
}

interface AuthContextType {
  persona: Persona | null;
  user: User | null;
  login: (persona: Persona, email: string, password: string) => void;
  signup: (
    persona: Persona,
    name: string,
    email: string,
    password: string,
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((p: Persona, _email: string, _password: string) => {
    const mockUser = MOCK_USERS[p];
    setPersona(p);
    setUser(mockUser);
  }, []);

  const signup = useCallback(
    (p: Persona, name: string, email: string, _password: string) => {
      const mockUser = MOCK_USERS[p];
      setPersona(p);
      setUser({
        id: `${p}_new`,
        name,
        email,
        wallet: "wallet" in mockUser ? mockUser.wallet : undefined,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    setPersona(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ persona, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
