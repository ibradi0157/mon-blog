"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { setAuthToken, setOnUnauthorized } from "../lib/api";
import { getMe } from "../services/auth";

export type RoleName = "PRIMARY_ADMIN" | "SECONDARY_ADMIN" | "MEMBER" | "SIMPLE_USER";
export type AuthUser = { id: string; email: string; displayName?: string; role?: RoleName } | null;

type AuthContextType = {
  user: AuthUser;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Helpers to update local state and optionally broadcast to other tabs
  const doLocalLogin = useCallback((t: string, u: AuthUser, broadcast = true) => {
    setToken(t);
    setUser(u);
    setAuthToken(t);
    try {
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
    } catch {}
    if (broadcast) bcRef.current?.postMessage({ type: "login", token: t, user: u });
  }, []);

  const doLocalLogout = useCallback((broadcast = true) => {
    setToken(null);
    setUser(null);
    setAuthToken(undefined);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    if (broadcast) bcRef.current?.postMessage({ type: "logout" });
  }, []);

  const login = useCallback((t: string, u: AuthUser) => doLocalLogin(t, u, true), [doLocalLogin]);
  const logout = useCallback(() => doLocalLogout(true), [doLocalLogout]);

  // Initial load from storage
  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const u = uStr ? (JSON.parse(uStr) as AuthUser) : null;
    if (t) {
      setToken(t);
      setAuthToken(t);
    }
    if (u) setUser(u);
    setReady(true);
  }, []);

  // Setup BroadcastChannel and storage listeners for cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    // BroadcastChannel (if supported)
    if ("BroadcastChannel" in window) {
      bcRef.current = new BroadcastChannel("auth");
      bcRef.current.onmessage = (ev: MessageEvent) => {
        const data = ev?.data as any;
        if (!data || typeof data !== "object") return;
        if (data.type === "logout") {
          doLocalLogout(false); // already broadcast by sender
        } else if (data.type === "login") {
          const { token: t, user: u } = data ?? {};
          if (typeof t === "string") doLocalLogin(t, u ?? null, false);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") {
        const t = e.newValue;
        if (!t) doLocalLogout(false);
        else {
          // Sync user too
          const uStr = localStorage.getItem("user");
          const u = uStr ? (JSON.parse(uStr) as AuthUser) : null;
          doLocalLogin(t, u, false);
        }
      }
      if (e.key === "user" && !localStorage.getItem("token")) {
        // If user changed but no token, ensure logged out
        doLocalLogout(false);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      try {
        bcRef.current?.close();
      } catch {}
      bcRef.current = null;
    };
  }, [doLocalLogin, doLocalLogout]);

  // Auto-logout on 401/403 globally via axios interceptor
  useEffect(() => {
    setOnUnauthorized(() => {
      doLocalLogout(true);
    });
    return () => setOnUnauthorized(undefined);
  }, [doLocalLogout]);

  // Periodically refresh current role from backend to auto-switch dashboards on promotion/demotion
  useEffect(() => {
    if (!ready || !token) return;

    let disposed = false;

    const refresh = async () => {
      try {
        const me = await getMe();
        if (!me?.success || !me.roleName) return;
        if (disposed) return;
        setUser((prev) => {
          if (!prev) return prev;
          const nextRole = me.roleName as RoleName;
          if (prev.role === nextRole) return prev;
          const next = { ...prev, role: nextRole } as typeof prev;
          try {
            localStorage.setItem("user", JSON.stringify(next));
          } catch {}
          return next;
        });
      } catch {
        // ignore, global interceptor handles unauthorized
      }
    };

    // Initial sync
    refresh();

    // Refresh on focus/visibility
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // Poll at intervals
    const interval = window.setInterval(refresh, 20000);

    return () => {
      disposed = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [ready, token]);

  const value = useMemo(() => ({ user, token, login, logout, ready }), [user, token, login, logout, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
