import axios from "axios";
import { logger, devLog } from "./logger";

// Base API URL configurable via NEXT_PUBLIC_API_BASE_URL; fallback to localhost in all environments
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL, timeout: 20000, withCredentials: true });
// Helpful in development to verify the API endpoint being used
devLog('API baseURL', baseURL);

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

let csrfToken: string | undefined;
let csrfBootstrapping: Promise<void> | null = null;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
function needsCsrf(method?: string) {
  return method ? !SAFE_METHODS.has(method.toUpperCase()) : false;
}

async function ensureCsrfToken(): Promise<void> {
  if (csrfToken) return;
  if (!csrfBootstrapping) {
    csrfBootstrapping = (async () => {
      try {
        const res = await api.get('/csrf', { withCredentials: true });
        const hdr = (res.headers as any)?.['x-csrf-token'] || (res.headers as any)?.['X-CSRF-Token'];
        if (hdr) csrfToken = String(hdr);
      } finally {
        csrfBootstrapping = null;
      }
    })();
  }
  await csrfBootstrapping;
}

api.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};
  // Always send cookies
  config.withCredentials = true;
  // Attach a request id and start time for logging
  const rid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  (config as any)._reqId = rid;
  (config as any)._startedAt = Date.now();
  if (authToken) {
    (config.headers as any)["Authorization"] = `Bearer ${authToken}`;
  }
  // Attach viewer id for both authenticated and anonymous users (client only)
  const viewerId = getViewerId();
  if (viewerId) {
    (config.headers as any)["X-Viewer-Id"] = viewerId;
  }
  // CSRF: bootstrap if needed for unsafe methods; avoid recursion for the bootstrap call itself
  const method = (config.method || 'GET').toUpperCase();
  const url = String(config.url || '');
  const isCsrfEndpoint = url.endsWith('/csrf');
  if (!isCsrfEndpoint && needsCsrf(method)) {
    if (!csrfToken) {
      await ensureCsrfToken();
    }
    if (csrfToken) {
      (config.headers as any)["X-CSRF-Token"] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    try {
      const startedAt = (res.config as any)._startedAt as number | undefined;
      const rid = (res.config as any)._reqId as string | undefined;
      const duration = startedAt ? Date.now() - startedAt : undefined;
      logger.debug('[api:response]', {
        reqId: rid,
        method: (res.config.method || 'GET').toUpperCase(),
        url: res.config.url,
        status: res.status,
        durationMs: duration,
      });
    } catch {}
    try {
      const hdr = (res.headers as any)?.['x-csrf-token'] || (res.headers as any)?.['X-CSRF-Token'];
      if (hdr) csrfToken = String(hdr);
    } catch {}
    return res;
  },
  (err) => {
    try {
      const cfg = err?.config || {};
      const startedAt = (cfg as any)._startedAt as number | undefined;
      const rid = (cfg as any)._reqId as string | undefined;
      const duration = startedAt ? Date.now() - startedAt : undefined;
      const status = err?.response?.status as number | undefined;
      // Support per-request logging controls
      const expected: number[] = Array.isArray((cfg as any)._expectedStatuses)
        ? (cfg as any)._expectedStatuses
        : [];
      const suppress: boolean = !!(cfg as any)._suppressErrorLog;
      const isExpected = typeof status === 'number' && expected.includes(status);
      const log = suppress || isExpected ? logger.debug : logger.error;
      log('[api:error]', {
        reqId: rid,
        method: (cfg.method || 'GET').toUpperCase(),
        url: cfg.url,
        status,
        durationMs: duration,
        message: err?.message,
        code: err?.code,
        isAxiosError: !!err?.isAxiosError,
      });
    } catch {}
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

        // Emit a compact preview of the response payload for easier debugging
        try {
          let preview: string | undefined;
          if (typeof data === 'string') {
            preview = data.length > 500 ? data.slice(0, 500) + '…' : data;
          } else {
            const serialized = JSON.stringify(data);
            preview = serialized.length > 500 ? serialized.slice(0, 500) + '…' : serialized;
          }
          const cfg = err?.config || {};
          const status = err?.response?.status as number | undefined;
          const expected: number[] = Array.isArray((cfg as any)._expectedStatuses)
            ? (cfg as any)._expectedStatuses
            : [];
          const suppress: boolean = !!(cfg as any)._suppressErrorLog;
          const isExpected = typeof status === 'number' && expected.includes(status);
          const log = suppress || isExpected ? logger.debug : logger.error;
          if (preview) log('[api:error:data]', preview);
        } catch {}
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