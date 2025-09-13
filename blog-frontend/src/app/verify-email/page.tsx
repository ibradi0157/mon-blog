"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { requestEmailCode, verifyEmail } from "../services/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <VerifyEmailPageClient />
    </Suspense>
  );
}

function VerifyEmailPageClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const emailParam = sp.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Vérifier votre email</h1>
      <p className="text-sm opacity-80 mb-3">Entrez le code à 6 chiffres envoyé à votre adresse email.</p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setNotice(null);
          if (!email.includes("@") || code.length !== 6) return;
          setLoading(true);
          try {
            await verifyEmail(email.trim(), code.trim());
            setNotice("Email vérifié. Vous pouvez maintenant vous connecter.");
            setTimeout(() => router.push("/login"), 800);
          } catch (e: any) {
            setNotice(e?.response?.data?.message ?? "Échec de la vérification");
          } finally {
            setLoading(false);
          }
        }}
      >
        <input className="w-full border rounded p-2 text-black" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2 text-black" placeholder="Code (6 chiffres)" value={code} onChange={(e) => setCode(e.target.value)} />
        {notice && <p className="text-sm opacity-90">{notice}</p>}
        <div className="flex gap-2">
          <button disabled={loading} className="flex-1 bg-blue-600 text-white rounded p-2">Vérifier</button>
          <button
            type="button"
            disabled={loading || !email.includes("@")}
            onClick={async () => {
              setLoading(true);
              setNotice(null);
              try {
                await requestEmailCode(email.trim());
                setNotice("Code renvoyé");
              } catch (e: any) {
                setNotice(e?.response?.data?.message ?? "Échec d'envoi du code");
              } finally {
                setLoading(false);
              }
            }}
            className="px-3 bg-gray-700 text-white rounded"
          >
            Renvoyer le code
          </button>
        </div>
      </form>
    </div>
  );
}
