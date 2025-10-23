"use client";
import { CommentsManager } from "@/app/components/comments/CommentsManager";

export default function DashboardCommentsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Gestion des commentaires</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        Modérer les commentaires, répondre aux utilisateurs et gérer les signalements.
      </p>
      <div className="border rounded-lg p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CommentsManager mode="admin" />
      </div>
    </div>
  );
}
