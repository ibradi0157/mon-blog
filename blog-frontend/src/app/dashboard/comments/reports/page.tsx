"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { CommentReportsTable } from "../components/CommentReportsTable";

export default function DashboardCommentReportsPage() {
  const { user, ready } = useAuth();

  // Wait for auth hydration
  if (!ready) return null;

  // Restrict to PRIMARY_ADMIN only
  if (user?.role !== "PRIMARY_ADMIN") {
    return (
      <div className="p-4 rounded border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
        Accès refusé — cette page est réservée au PRIMARY_ADMIN.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Signalements de commentaires</h1>
      <CommentReportsTable />
    </div>
  );
}
