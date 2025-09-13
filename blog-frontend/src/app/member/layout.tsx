"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    if (user.role === "PRIMARY_ADMIN" || user.role === "SECONDARY_ADMIN") {
      router.replace("/dashboard");
      return;
    }
    if (user.role === "SIMPLE_USER") {
      router.replace("/user");
      return;
    }
    if (user.role !== "MEMBER") {
      router.replace("/");
    }
  }, [user, router, ready, isClient]);

  // Show nothing during SSR/hydration
  if (!isClient || !ready) {
    return null;
  }

  // Redirect if not authorized
  if (!user || user.role !== "MEMBER") {
    return null;
  }

  // Navigation items
  const nav = [
    { href: "/member", label: "Accueil", icon: Home, exact: true },
    { href: "/member/articles", label: "Articles", icon: FileText },
    { href: "/member/comments", label: "Commentaires", icon: MessageSquare },
    { href: "/member/settings", label: "Paramètres", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 -translate-x-full md:translate-x-0 md:static
            ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}
            transition-transform md:transition-all duration-300 ease-in-out
            bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen
            ${mobileOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'}
          `}
          aria-hidden={!mobileOpen}
          role={mobileOpen ? 'dialog' : undefined}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Espace membre</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Close on mobile */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label={sidebarCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user.displayName?.charAt(0) || user.email.charAt(0)}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {user.displayName || user.email}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Membre
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href) && pathname !== "/member";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay when mobile sidebar is open */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity duration-300 ease-in-out"
            onClick={() => setMobileOpen(false)}
            aria-hidden
            aria-modal="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen relative">
          {/* Top Bar */}
          <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-700/60 px-3 md:px-6 py-4 safe-px supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger */}
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {nav.find(item =>
                    item.exact
                      ? pathname === item.href
                      : pathname?.startsWith(item.href) && pathname !== "/member"
                  )?.label || "Espace membre"}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Gérez vos contenus depuis cet espace
                </p>
              </div>
            </div>
          </header>

          {/* Decorative background for right panel */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5" />

          {/* Page Content */}
          <div className="p-6 safe-px">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
              <div className="p-4 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
