"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!ready || !isClient) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "SIMPLE_USER") {
      if (user.role === "MEMBER") router.replace("/member");
      else if (user.role?.includes("ADMIN")) router.replace("/dashboard");
      else router.replace("/");
    }
  }, [user, router, ready, isClient]);

  // Show nothing during SSR/hydration
  if (!isClient || !ready) {
    return null;
  }

  // Redirect if not authorized
  if (!user || user.role !== "SIMPLE_USER") {
    return null;
  }

  const nav = [
    { href: "/user", label: "Accueil" },
    { href: "/user/profile", label: "Profil" },
  ];

  return (
    <div className="min-h-screen">
      {/* Espace vide en haut */}
      <div className="h-20" aria-hidden="true"></div>
      
      {/* Header avec hamburger mobile */}
      <header className="px-4 py-3 md:hidden">
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 space-y-4 md:hidden transform transition-transform">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Menu</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-sm opacity-70">Connecté en tant que</p>
              <p className="font-medium">{user.displayName ?? user.email}</p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">UTILISATEUR</span>
            </div>
            <nav className="space-y-1">
              {nav.map((n) => {
                const active = pathname?.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 ${active ? "bg-black/10 dark:bg-white/10 font-medium" : ""}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 min-h-[70vh] px-4">
        {/* Sidebar desktop */}
        <aside className="hidden md:block border-r border-black/10 dark:border-white/10 p-4 space-y-4 md:sticky md:top-24 h-max">
          <div>
            <p className="text-sm opacity-70">Connecté en tant que</p>
            <p className="font-medium">{user.displayName ?? user.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-indigo-600 text-white">UTILISATEUR</span>
          </div>
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`block px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 ${active ? "bg-black/10 dark:bg-white/10 font-medium" : ""}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="p-4">{children}</section>
      </div>
    </div>
  );
}
