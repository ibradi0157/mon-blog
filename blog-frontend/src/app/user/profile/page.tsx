"use client";
import { useAuth } from "@/app/providers/AuthProvider";

export default function UserProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <p className="text-slate-600 dark:text-slate-400">Gérez vos informations de base.</p>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs opacity-60">Nom affiché</p>
          <p className="font-medium">{user?.displayName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs opacity-60">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <span className="inline-block text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">UTILISATEUR</span>
        </div>
      </div>
    </div>
  );
}
