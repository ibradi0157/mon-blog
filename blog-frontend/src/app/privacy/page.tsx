import React from "react";
import { getPublicLegal, type LegalPage } from "../services/legal";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  let page: LegalPage | null = null;
  try {
    page = await getPublicLegal("privacy");
  } catch (err: any) {
    if (err?.response?.status !== 404) throw err;
  }

  return (
    <div className="px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 
        md:rounded-2xl md:border md:border-slate-200/60 md:dark:border-slate-700/60 
        md:bg-white/70 md:dark:bg-slate-900/50 md:shadow-lg md:backdrop-blur 
        md:supports-[backdrop-filter]:bg-white/60 md:dark:supports-[backdrop-filter]:bg-slate-900/60">
        {page ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-semibold sm:font-bold text-slate-900 dark:text-white mb-3 sm:mb-6">{page.title}</h1>
            <article
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-24 sm:prose-lg"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
            <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Dernière mise à jour: {new Date(page.updatedAt).toLocaleDateString()}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-semibold sm:font-bold text-slate-900 dark:text-white mb-4">Politique de confidentialité</h1>
            <p className="text-slate-700 dark:text-slate-300">
              Cette page n'est pas disponible pour le moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
