"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { registerApi, checkEmailAvailability, requestEmailCode } from "../services/auth";
import { useAuth } from "../providers/AuthProvider";
import Link from "next/link";
import Script from "next/script";

export default function RegisterPage() {
  const { user } = useAuth();
  // Registration form page – render consistently on server and client

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{ checking: boolean; available?: boolean; message?: string }>({ checking: false });
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const shouldUseRecaptcha = Boolean(recaptchaSiteKey);
  const widgetIdRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Validation des exigences de mot de passe
  const passwordReqs = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const allReqsMet = Object.values(passwordReqs).every(Boolean);

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
        callback: (token: string) => {
          setRecaptchaToken(token);
        },
        'expired-callback': () => {
          setRecaptchaToken(undefined);
        },
        'error-callback': () => {
          setRecaptchaToken(undefined);
        },
      });
    }
    tryRender();
  }, [shouldUseRecaptcha, recaptchaSiteKey]);

  // Email validation avec debounce
  const validateEmail = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || emailToCheck.length < 3) {
      setEmailValidation({ checking: false });
      return;
    }

    setEmailValidation({ checking: true });
    try {
      const result = await checkEmailAvailability(emailToCheck);
      setEmailValidation({ checking: false, available: result.available, message: result.message });
    } catch (error) {
      setEmailValidation({ checking: false, available: false, message: 'Erreur lors de la vérification' });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && email.includes('@')) {
        validateEmail(email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, validateEmail]);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Créer un compte</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Rejoignez la communauté</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (password !== confirmPassword) {
              setError("Les mots de passe ne correspondent pas");
              return;
            }
            if (emailValidation.available === false) {
              setError("Cet email n'est pas disponible");
              return;
            }
            try {
              let tokenToSend: string | undefined = recaptchaToken;
              if (shouldUseRecaptcha) {
                if (!tokenToSend && widgetIdRef.current !== null) {
                  const grecaptcha = (window as any).grecaptcha;
                  tokenToSend = grecaptcha?.getResponse(widgetIdRef.current) || undefined;
                }
                if (!tokenToSend) {
                  setError("Veuillez cocher le reCAPTCHA");
                  return;
                }
              }
              await registerApi(email, password, displayName, confirmPassword, tokenToSend);
              router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? "Échec d'inscription";
              setError(msg);
              // If backend rejected captcha, reset widget so user can retry
              if (shouldUseRecaptcha && widgetIdRef.current !== null) {
                try {
                  const grecaptcha = (window as any).grecaptcha;
                  grecaptcha?.reset?.(widgetIdRef.current);
                } catch {}
                setRecaptchaToken(undefined);
              }
            }
          }}
        >
          <input 
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Nom d'utilisateur" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            required
          />
          <div className="relative">
            <input 
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailValidation.available === false 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : emailValidation.available === true
                    ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              } text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400`}
              placeholder="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            {emailValidation.checking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {emailValidation.message && !emailValidation.checking && (
              <p className={`text-xs mt-1 ${
                emailValidation.available ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              }`}>
                {emailValidation.message}
              </p>
            )}
          </div>
          <div className="relative">
            <input 
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="Mot de passe" 
              type="password" 
              autoComplete="new-password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordReqs(true)}
              onBlur={() => setShowPasswordReqs(false)}
              required
            />
            {showPasswordReqs && password && (
              <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Exigences du mot de passe :</p>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordReqs.minLength ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    Au moins 8 caractères
                  </div>
                  <div className={`flex items-center gap-2 ${passwordReqs.hasUpper ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    Au moins une majuscule (A-Z)
                  </div>
                  <div className={`flex items-center gap-2 ${passwordReqs.hasLower ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    Au moins une minuscule (a-z)
                  </div>
                  <div className={`flex items-center gap-2 ${passwordReqs.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    Au moins un chiffre (0-9)
                  </div>
                  <div className={`flex items-center gap-2 ${passwordReqs.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    Au moins un caractère spécial (!@#$%^&*)
                  </div>
                </div>
              </div>
            )}
          </div>
          <input 
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Confirmez le mot de passe" 
            type="password" 
            autoComplete="new-password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required
          />
          {shouldUseRecaptcha && (
            <div className="pt-1">
              <div ref={containerRef} className="g-recaptcha" />
              <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" />
            </div>
          )}

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-60" disabled={!allReqsMet || emailValidation.available === false}>Créer un compte</button>
        </form>
      </div>
    </div>
  );
}
