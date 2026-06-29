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

function saveSession(tokens: AuthTokens, user: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function loadSession(): { tokens: AuthTokens; user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!accessToken || !refreshToken || !userStr) return null;
  try {
    const user = JSON.parse(userStr) as AuthUser;
    return { tokens: { accessToken, refreshToken }, user };
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
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
    const session = loadSession();
    Promise.resolve().then(() => {
      if (session) {
        setTokens(session.tokens);
        setUser(session.user);
      }
      setIsLoading(false);
    });
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

    // Verify user has admin role
    if (userData.role !== "admin") {
      throw new Error("Access denied: Admin privileges required");
    }

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    const newTokens: AuthTokens = { accessToken, refreshToken };
    saveSession(newTokens, userData);
    setTokens(newTokens);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const API_BASE = getApiBase();
    const currentTokens = tokens ?? loadSession()?.tokens;

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
    const currentTokens = tokens ?? loadSession()?.tokens;
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
      const currentUser = user ?? loadSession()?.user;
      if (currentUser) {
        saveSession(newTokens, currentUser);
      }
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
