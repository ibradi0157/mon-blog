import axios from "axios";

// Base API URL configurable via NEXT_PUBLIC_API_BASE_URL; fallback to localhost in all environments
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL, timeout: 20000 });

let authToken: string | undefined;
export function setAuthToken(token?: string) {
  authToken = token;
}

// Allow consumers (AuthProvider) to register a handler for 401/403
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler?: () => void) {
  onUnauthorized = handler ?? null;
}

// Generate and persist a stable anonymous viewer id (browser only)
export function getViewerId(): string | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    const key = "viewerId";
    let v = window.localStorage.getItem(key) || "";
    if (!v) {
      const gen = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      v = gen;
      window.localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return undefined;
  }
}

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  if (authToken) {
    (config.headers as any)["Authorization"] = `Bearer ${authToken}`;
  }
  // Attach viewer id for both authenticated and anonymous users (client only)
  const viewerId = getViewerId();
  if (viewerId) {
    (config.headers as any)["X-Viewer-Id"] = viewerId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const data = err?.response?.data;
      // Prefer explicit messages
      if (data) {
        let msg: string | undefined;
        if (Array.isArray(data?.message)) {
          msg = data.message.join(", ");
        } else if (typeof data?.message === "string" && data?.message.trim()) {
          msg = data.message;
        } else if (typeof data?.error === "string" && data?.error.trim()) {
          msg = data.error;
        } else if (data?.errors) {
          // Handle various formats: array of strings, object of arrays, etc.
          if (Array.isArray(data.errors)) {
            msg = data.errors.map((e: any) => (typeof e === "string" ? e : JSON.stringify(e))).join(", ");
          } else if (typeof data.errors === "object") {
            msg = Object.entries(data.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`)
              .join(" | ");
          }
        } else if (data?.detail) {
          msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
        if (msg) err.message = msg;
      }
    } catch (_) {
      // no-op, fall back to default message
    }

    // Auto-logout on unauthorized (client only)
    try {
      const status = err?.response?.status;
      if (status === 401 && typeof window !== "undefined") {
        onUnauthorized?.();
      }
    } catch {}

    return Promise.reject(err);
  }
);

export function getUploadsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/g, "");
  try {
    const u = new URL(baseURL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

export function toAbsoluteImageUrl(input?: string | null): string | undefined {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  const base = getUploadsBase();
  if (!base) return input;
  const left = base.replace(/\/+$/g, "");
  const right = String(input).replace(/^\/+/, "");
  return `${left}/${right}`;
}

export function buildSrcSet(thumbnails?: string[]): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  const parts = thumbnails
    .map((t) => {
      const abs = toAbsoluteImageUrl(t);
      const m = t.match(/-(\d+)w\./);
      if (!abs || !m?.[1]) return null;
      return `${abs} ${m[1]}w`;
    })
    .filter(Boolean) as string[];
  return parts.length ? parts.join(", ") : undefined;
}