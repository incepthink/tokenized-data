import { axiosInstance } from "@/lib/axios";
import type { Persona } from "@/mock/data";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  persona: Persona;
  wallet: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function signup(
  name: string,
  email: string,
  password: string,
  persona: Persona,
  wallet?: string
): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>("/auth/signup", {
    name,
    email,
    password,
    persona,
    ...(wallet ? { wallet } : {}),
  });
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<AuthUser>("/auth/me");
  return data;
}
