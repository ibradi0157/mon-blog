"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminListLegal } from "@/app/services/legal";

export default function AdminLegalListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-legal-list"],
    queryFn: adminListLegal,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Pages légales</h2>
      </div>
      {isLoading && <p className="text-slate-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur de chargement</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["privacy", "terms"] as const).map((slug) => {
          const item = data?.find((p) => p.slug === slug);
          return (
            <Link
              key={slug}
              href={`/dashboard/legal/${slug}`}
              className="block rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white/70 dark:bg-slate-900/30 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <h3 className="font-medium flex items-center gap-2">
                {item?.title || (slug === "privacy" ? "Politique de confidentialité" : "Conditions d'utilisation")}
                {item && (
                  <span
                    className={
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
                      (item.published
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300")
                    }
                  >
                    {item.published ? "Publié" : "Brouillon"}
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {item ? `Modifié le ${new Date(item.updatedAt).toLocaleDateString()}` : "Non créé — cliquez pour éditer"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
