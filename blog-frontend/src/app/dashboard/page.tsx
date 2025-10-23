"use client";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { FileText, MessageSquare, Users, Tags, BarChart2, Settings, Scale, LayoutTemplate } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "PRIMARY_ADMIN" || user.role === "SECONDARY_ADMIN");

  if (!isAdmin) {
    return (
      <div className="space-y-2 p-4">
        <h1 className="text-2xl font-semibold dark:text-slate-100">Accès réservé</h1>
        <p className="opacity-80 text-slate-700 dark:text-slate-300">Panneau accessible uniquement aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-600 dark:text-slate-400">Bienvenue, gérez le contenu et les utilisateurs en un clin d'œil.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Articles</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Lister, créer, publier ou dépublier.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/articles" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Ouvrir</Link>
            <Link href="/dashboard/articles/new" className="px-3 py-2 rounded bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">Nouveau</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Commentaires</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Modération, rapports, détails des fils.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/dashboard/comments" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Modérer</Link>
            <Link href="/dashboard/comments/reports" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Signalements</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Utilisateurs</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gestion des rôles et comptes.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/users" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Gérer</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Catégories</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Organisation du contenu.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/categories" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Ouvrir</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Statistiques</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Vues, likes, engagement.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/stats" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Voir</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-700 dark:bg-slate-600 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Paramètres</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Configuration générale.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/settings" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Configurer</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-rose-600 dark:bg-rose-500 text-white flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Pages légales</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Mentions, CGU, Politique.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/legal" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Ouvrir</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 sm:col-span-2 lg:col-span-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Homepage</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Éditeur & sections.</p>
            </div>
          </div>
          <div>
            <Link href="/dashboard/homepage" className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Personnaliser</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
