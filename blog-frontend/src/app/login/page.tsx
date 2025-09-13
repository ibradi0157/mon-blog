"use client";
import { useState } from "react";
import { loginApi, forgotPassword } from "../services/auth";
import { useAuth } from "../providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center safe-px py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6">
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
              const res = await loginApi(email, password);
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
                await forgotPassword(email.trim());
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
