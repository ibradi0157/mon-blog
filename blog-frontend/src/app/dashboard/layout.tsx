"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Home,
  Tag,
  MessageSquare,
  Flag,
  Bell,
  Mail,
  ChevronRight,
  ChevronLeft,
  User,
  Shield,
  Search,
  Menu,
  X,
  Palette,
  Layers
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Mount gate to ensure SSR and initial client render match, avoiding hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = user?.role === "PRIMARY_ADMIN" || user?.role === "SECONDARY_ADMIN";

  useEffect(() => {
    if (!ready) return;
    if (!user || !isAdmin) {
      router.replace("/");
    }
  }, [user, router, isAdmin, ready]);

  // Ensure hooks order remains stable across renders while still avoiding hydration mismatch
  if (!mounted) {
    // Render nothing until mounted so the server and client markup stay in sync
    return null;
  }

  if (!ready || !user || !isAdmin) {
    return (
      <div className="min-h-screen w-full max-w-none bg-slate-50 dark:bg-slate-900">
        <div className="flex w-full max-w-none">
          {/* Skeleton Sidebar */}
          <div className="hidden md:block md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
          {/* Skeleton Main Content */}
          <main className="flex-1 w-full p-6 animate-pulse">
            <div className="h-12 bg-white dark:bg-slate-800 rounded mb-6"></div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Navigation avec permissions basées sur le rôle
  const getNavItems = () => {
    const baseItems = [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/articles", label: "Articles", icon: FileText },
      { href: "/dashboard/categories", label: "Catégories", icon: Tag },
      { href: "/dashboard/comments", label: "Commentaires", icon: MessageSquare },
      { href: "/dashboard/subscriptions", label: "Abonnements", icon: Bell },
      { href: "/dashboard/email-templates", label: "Templates d'emails", icon: Mail },
      { href: "/dashboard/stats", label: "Statistiques", icon: BarChart3 },
    ];

    // Éléments réservés au PRIMARY_ADMIN
    if (user?.role === "PRIMARY_ADMIN") {
      baseItems.splice(3, 0, { href: "/dashboard/comments/reports", label: "Signalements", icon: Flag });
      baseItems.push(
        { href: "/dashboard/users", label: "Utilisateurs", icon: Users },
        { href: "/dashboard/homepage", label: "Page d'accueil", icon: Home },
        { href: "/dashboard/footer", label: "Pied de page", icon: Layers },
        { href: "/dashboard/legal", label: "Pages légales", icon: FileText },
        { href: "/dashboard/settings", label: "Paramètres", icon: Settings }
      );
    }

    // Accès limité pour SECONDARY_ADMIN: afficher la page Utilisateurs uniquement
    if (user?.role === "SECONDARY_ADMIN") {
      baseItems.push({ href: "/dashboard/users", label: "Utilisateurs", icon: Users });
    }

    return baseItems;
  };

  const nav = getNavItems();

  return (
    <div className="min-h-screen w-full max-w-none bg-slate-50 dark:bg-slate-900">
      <div className="flex w-full max-w-none">
        {/* Sidebar */}
        <aside
          style={{ WebkitOverflowScrolling: 'touch' }}
          className={`
            fixed inset-y-0 left-0 z-40 w-80 lg:w-72 lg:translate-x-0 lg:static
            ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
            transition-transform lg:transition-all duration-300 ease-in-out
            bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen overflow-y-auto
            ${mobileOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'}
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
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Admin Panel</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {/* Close on mobile */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:inline-flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "PRIMARY_ADMIN" 
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role === "PRIMARY_ADMIN" ? "Admin Principal" : "Admin"}
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
                : pathname?.startsWith(item.href) && pathname !== "/dashboard";
              
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

          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
              <div className="space-y-2">
                <Link 
                  href="/"
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Voir le site</span>
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* Overlay when mobile sidebar is open */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden transition-opacity duration-300 ease-in-out"
            onClick={() => setMobileOpen(false)}
            aria-hidden
            aria-modal="true"
          />
        )}

  {/* Main Content */}
  <main className="flex-1 w-full max-w-none min-h-screen relative overflow-x-hidden">
          {/* Espace vide en haut */}
          <div className="h-20" aria-hidden="true"></div>
          
          {/* Top Bar avec hamburger */}
          <header className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Hamburger */}
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Decorative background for right panel */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5" />

          {/* Page Content */}
          <div className="w-full max-w-none p-3 sm:p-6">
            <div className="w-full max-w-none rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/50 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
              <div className="w-full p-3 sm:p-4 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
