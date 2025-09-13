"use client";
import { useState } from "react";
import { registerApi, requestEmailCode } from "../services/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center safe-px py-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6">
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
            try {
              await registerApi(email, password, displayName, confirmPassword);
              await requestEmailCode(email);
              router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            } catch (e: any) {
              setError(e?.response?.data?.message ?? "Échec d'inscription");
            }
          }}
        >
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nom d'utilisateur" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Confirmez le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 transition-colors">Créer un compte</button>
        </form>
      </div>
    </div>
  );
}
