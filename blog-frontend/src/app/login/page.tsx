"use client";
import { useEffect, useRef, useState } from "react";
import { loginApi, forgotPassword } from "../services/auth";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { login, user } = useAuth();
  const router = useRouter();
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  // Enable in any environment when a site key is provided (dev and prod)
  const shouldUseRecaptcha = Boolean(recaptchaSiteKey);
  const widgetIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = user.role?.includes('ADMIN')
        ? '/dashboard'
        : user.role === 'MEMBER'
          ? '/member'
          : user.role === 'SIMPLE_USER'
            ? '/user'
            : '/';
      router.push(dashboardPath);
    }
  }, [user, router]);

  // Render Google reCAPTCHA v2 checkbox when a site key is present
  useEffect(() => {
    if (!shouldUseRecaptcha) return;
    if (!containerRef.current) return;
    function tryRender() {
      const grecaptcha = (window as any).grecaptcha;
      if (!grecaptcha || !grecaptcha.render) {
        setTimeout(tryRender, 200);
        return;
      }
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = grecaptcha.render(containerRef.current!, {
        sitekey: recaptchaSiteKey,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      });
    }
    tryRender();
  }, [shouldUseRecaptcha, recaptchaSiteKey]);

  // Show loading state while checking authentication
  if (user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center safe-px py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-xl p-6">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connexion</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Heureux de vous revoir</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setNotice(null);
            try {
              let token: string | undefined = undefined;
              if (shouldUseRecaptcha && widgetIdRef.current !== null) {
                const grecaptcha = (window as any).grecaptcha;
                token = grecaptcha?.getResponse(widgetIdRef.current) || undefined;
                if (!token) {
                  setError("Veuillez cocher le reCAPTCHA");
                  return;
                }
              }
              const res = await loginApi(email, password, token);
              const user = res.user ? { ...res.user, role: res.user.role as any } : null;
              login(res.access_token, user);
              router.push("/dashboard");
            } catch (e: any) {
              setError(e?.response?.data?.message ?? "Échec de connexion");
            }
          }}
        >
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {shouldUseRecaptcha && (
            <div className="pt-1">
              {/* Google reCAPTCHA v2 checkbox */}
              <div ref={containerRef} className="g-recaptcha" />
              {/* Load script explicitly */}
              <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" />
            </div>
          )}
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          {notice && <p className="text-emerald-700 dark:text-emerald-400 text-sm">{notice}</p>}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors">Se connecter</button>
          <button
            type="button"
            className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
            disabled={!email.includes("@")}
            onClick={async () => {
              setError(null);
              setNotice(null);
              try {
                let token: string | undefined = undefined;
                if (shouldUseRecaptcha && widgetIdRef.current !== null) {
                  const grecaptcha = (window as any).grecaptcha;
                  token = grecaptcha?.getResponse(widgetIdRef.current) || undefined;
                  if (!token) {
                    setError("Veuillez cocher le reCAPTCHA");
                    return;
                  }
                }
                await forgotPassword(email.trim(), token);
                setNotice("Si un compte existe pour cet email, un message a été envoyé.");
              } catch (_) {
                // Toujours un message générique
                setNotice("Si un compte existe pour cet email, un message a été envoyé.");
              }
            }}
          >
            Mot de passe oublié ?
          </button>
        </form>
      </div>
    </div>
  );
}
