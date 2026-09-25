import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, tokenStore } from "./api-client";

export type Role = "ADMIN" | "MANAGER" | "SELLER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  twoFactorEnabled: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<LoginResponse>;
  verify2fa: (challengeToken: string, code: string) => Promise<void>;
  signOut: () => void;
  refreshMe: () => Promise<void>;
}

type LoginResponse =
  | { status: "AUTHENTICATED"; user: AuthUser }
  | { status: "TWOFA_REQUIRED"; challengeToken: string };

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await apiFetch<{ user: AuthUser }>("/auth/me");
      setUser(user);
    } catch {
      tokenStore.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    const result = await apiFetch<
      | { status: "AUTHENTICATED"; user: AuthUser; tokens: { accessToken: string; refreshToken: string } }
      | { status: "TWOFA_REQUIRED"; challengeToken: string }
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
    if (result.status === "AUTHENTICATED") {
      tokenStore.set(result.tokens.accessToken, result.tokens.refreshToken);
      setUser(result.user);
      return { status: "AUTHENTICATED", user: result.user };
    }
    return { status: "TWOFA_REQUIRED", challengeToken: result.challengeToken };
  }, []);

  const verify2fa = useCallback<AuthContextValue["verify2fa"]>(async (challengeToken, code) => {
    const result = await apiFetch<{
      status: string;
      user: AuthUser;
      tokens: { accessToken: string; refreshToken: string };
    }>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
      auth: false,
    });
    tokenStore.set(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, signIn, verify2fa, signOut, refreshMe: loadMe }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
