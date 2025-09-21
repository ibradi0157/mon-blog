"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { resetPassword } from "../services/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}

function ResetPasswordPageClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [tokenId, setTokenId] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);

  useEffect(() => {
    const tid = sp.get("tokenId");
    const t = sp.get("token");
    if (tid) setTokenId(tid);
    if (t) setToken(t);
  }, [sp]);

  // Validation des exigences de mot de passe
  const passwordReqs = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  };
  const allReqsMet = Object.values(passwordReqs).every(Boolean);
  const canSubmit = allReqsMet && newPassword === confirmPassword && !loading;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Réinitialiser le mot de passe</h1>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setLoading(true);
          setNotice(null);
          try {
            await resetPassword(tokenId.trim(), token.trim(), newPassword, confirmPassword);
            setNotice("Mot de passe réinitialisé. Vous pouvez vous connecter.");
            setTimeout(() => router.push("/login"), 1200);
          } catch (e: any) {
            setNotice(e?.response?.data?.message ?? "Échec de la réinitialisation");
          } finally {
            setLoading(false);
          }
        }}
      >
        {/* Champs token cachés, non visibles ni modifiables par l'utilisateur */}
        <input type="hidden" value={tokenId} readOnly />
        <input type="hidden" value={token} readOnly />
        <div className="relative">
          <input
            className="w-full border rounded p-2 text-black"
            placeholder="Nouveau mot de passe (≥ 8)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setShowPasswordReqs(true)}
            onBlur={() => setShowPasswordReqs(false)}
            required
          />
          {showPasswordReqs && newPassword && (
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
          className="w-full border rounded p-2 text-black"
          placeholder="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {notice && <p className="text-sm opacity-90">{notice}</p>}
        <button disabled={!canSubmit} className="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-60">Réinitialiser</button>
      </form>
    </div>
  );
}
