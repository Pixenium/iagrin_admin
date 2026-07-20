"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getApiBase } from "./api";

/* ─── Types ─── */

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  provider?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => false,
});

/* ─── Storage Helpers ─── */

const STORAGE_KEYS = {
  ACCESS_TOKEN: "iagrin_access_token",
  REFRESH_TOKEN: "iagrin_refresh_token",
  USER: "iagrin_user",
} as const;

function saveSession(tokens: AuthTokens) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
}

function loadTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  // Also clear legacy keys
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  sessionStorage.removeItem("iagrin_access_token");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
}

/* ─── Provider ─── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      setTokens(tokens);
      fetch(`${getApiBase()}/user/profile`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(body => {
        const u = body?.data;
        if (u && u.role === "admin" && u.email === "admin@iagrin.com") {
          setUser({ id: u.id, name: u.name, email: u.email, role: u.role, provider: u.provider || "local" });
        } else {
          clearSession();
          setTokens(null);
          setUser(null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json().catch(() => ({ message: "Network error" }));

    if (!res.ok) {
      throw new Error(body?.message || body?.error || `Login failed (${res.status})`);
    }

    const data = body?.data ?? body;
    const accessToken = data?.tokens?.accessToken ?? data?.token ?? "";
    const refreshToken = data?.tokens?.refreshToken ?? "";
    const userData: AuthUser = {
      id: data?.user?.id ?? data?.user?._id ?? "",
      name: data?.user?.name ?? data?.user?.fullName ?? "",
      email: data?.user?.email ?? email,
      role: data?.user?.role ?? "user",
      provider: data?.user?.provider ?? "local",
    };

    // Verify user has admin role and is the authorized admin email
    if (userData.role !== "admin" || userData.email !== "admin@iagrin.com") {
      throw new Error("Access denied: You are not authorized to access this admin panel.");
    }

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    const newTokens: AuthTokens = { accessToken, refreshToken };
    saveSession(newTokens);
    setTokens(newTokens);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const API_BASE = getApiBase();
    const currentTokens = tokens ?? loadTokens();

    // Try server-side logout (non-blocking)
    if (currentTokens?.refreshToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(currentTokens.accessToken ? { Authorization: `Bearer ${currentTokens.accessToken}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
        });
      } catch {
        // Ignore logout errors — we clear locally regardless
      }
    }

    clearSession();
    setTokens(null);
    setUser(null);
  }, [tokens]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const API_BASE = getApiBase();
    const currentTokens = tokens ?? loadTokens();
    if (!currentTokens?.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      if (!res.ok) {
        clearSession();
        setTokens(null);
        setUser(null);
        return false;
      }

      const body = await res.json();
      const data = body?.data ?? body;
      const newAccessToken = data?.tokens?.accessToken ?? data?.token ?? "";
      const newRefreshToken = data?.tokens?.refreshToken ?? currentTokens.refreshToken;

      if (!newAccessToken) {
        clearSession();
        setTokens(null);
        setUser(null);
        return false;
      }

      const newTokens: AuthTokens = { accessToken: newAccessToken, refreshToken: newRefreshToken };
      saveSession(newTokens);
      setTokens(newTokens);
      return true;
    } catch {
      clearSession();
      setTokens(null);
      setUser(null);
      return false;
    }
  }, [tokens, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens?.accessToken,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
