"use client";
import { CommentsManager } from "@/app/components/comments/CommentsManager";

export default function DashboardCommentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Gestion des commentaires</h1>
      <CommentsManager mode="admin" />
    </div>
  );
}
