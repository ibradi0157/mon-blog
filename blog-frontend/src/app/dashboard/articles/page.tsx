"use client";
import Link from "next/link";
import { ArticlesTable } from "./components/ArticlesTable";

export default function DashboardArticlesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des articles</h1>
        <Link href="/dashboard/articles/new" className="px-3 py-1.5 rounded bg-emerald-600 text-white">Nouvel article</Link>
      </div>
      <p className="opacity-80">Publier / dépublier / supprimer n’importe quel article. Filtrer par statut, auteur.</p>
      <div className="border rounded p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <ArticlesTable />
      </div>
    </div>
  );
}
