"use client";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";

export default function UserHomePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon espace</h1>
        <p className="text-slate-600 dark:text-slate-400">Bienvenue {user?.displayName ?? user?.email}.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/user/profile" className="border rounded-lg p-4 hover:bg-black/5 dark:hover:bg-white/10 transition">
          <h2 className="font-semibold mb-1">Profil</h2>
          <p className="text-sm opacity-70">Voir et mettre à jour vos informations.</p>
        </Link>
      </div>
    </div>
  );
}
