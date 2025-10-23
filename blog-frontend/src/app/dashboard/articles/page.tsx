"use client";
import Link from "next/link";
import { ArticlesTable } from "./components/ArticlesTable";

export default function DashboardArticlesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Gestion des articles</h1>
        <Link 
          href="/dashboard/articles/new" 
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors duration-200 flex items-center gap-2"
        >
          <span className="text-sm font-medium">Nouvel article</span>
          <span className="text-lg">+</span>
        </Link>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        Publier / dépublier / supprimer n'importe quel article. Filtrer par statut, auteur.
      </p>
      <div className="border rounded-lg p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <ArticlesTable />
      </div>
    </div>
  );
}
