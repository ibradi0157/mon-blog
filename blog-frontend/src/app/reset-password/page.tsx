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

  useEffect(() => {
    const tid = sp.get("tokenId");
    const t = sp.get("token");
    if (tid) setTokenId(tid);
    if (t) setToken(t);
  }, [sp]);

  const canSubmit = tokenId && token && newPassword.length >= 6 && newPassword === confirmPassword;

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
        <input className="w-full border rounded p-2 text-black" placeholder="Token ID" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
        <input className="w-full border rounded p-2 text-black" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
        <input className="w-full border rounded p-2 text-black" placeholder="Nouveau mot de passe (≥ 6)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="w-full border rounded p-2 text-black" placeholder="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {notice && <p className="text-sm opacity-90">{notice}</p>}
        <button disabled={loading || !canSubmit} className="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-60">Réinitialiser</button>
      </form>
    </div>
  );
}
