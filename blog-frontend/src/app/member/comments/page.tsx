"use client";
import Link from "next/link";
import { CommentsManager } from "@/app/components/comments/CommentsManager";

// Replaced query-param driven view with unified CommentsManager (member mode)

export default function MemberCommentsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des commentaires</h1>
        <Link href="/member/articles" className="text-sm text-blue-600 hover:underline">
          ← Mes articles
        </Link>
      </header>
      <CommentsManager mode="member" />
    </div>
  );
}
