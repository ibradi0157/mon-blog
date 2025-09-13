"use client";
import { useState } from "react";
import { forgotPassword } from "../services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Mot de passe oublié</h1>
      <p className="text-sm opacity-80 mb-3">Entrez votre email pour recevoir un lien/code de réinitialisation.</p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email.includes("@")) return;
          setLoading(true);
          setNotice(null);
          try {
            await forgotPassword(email.trim());
            setNotice("Si un compte existe, des instructions ont été envoyées.");
          } catch (_) {
            // Message générique pour éviter l'énumération
            setNotice("Si un compte existe, des instructions ont été envoyées.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          type="email"
          className="w-full border rounded p-2 text-black"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {notice && <p className="text-sm opacity-90">{notice}</p>}
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded p-2">Envoyer</button>
      </form>
    </div>
  );
}
