"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  FileText, 
  Users,
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Bell
} from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useRouter, usePathname } from "next/navigation";
import { suggestPublicArticles, type Article } from "../services/articles";
import { useSiteSettings } from "@/app/providers/SiteSettingsProvider";
import { toAbsoluteImageUrl } from "@/app/lib/api";

export function PremiumNavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Force sticky navbar globally (user requested navbar fixed on all pages)
  const stickyAllowed = true;
  
  const dashboardPath = user?.role?.includes('ADMIN')
    ? '/dashboard'
    : user?.role === 'MEMBER'
      ? '/member'
      : user
        ? '/user'
        : '/login';

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      const items = await suggestPublicArticles(q, 8);
      setSuggestions(items);
      setShowSuggestions(true);
      setLoadingSuggestions(false);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Scroll detection (only when sticky is allowed)
  useEffect(() => {
    if (!stickyAllowed) {
      setIsScrolled(false);
      return;
    }

    function onScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname, stickyAllowed]);

  const isActive = (path: string) => pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (articleId: string) => {
    router.push(`/article/${articleId}`);
    setShowSuggestions(false);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* Premium Navigation Bar */}
      <nav 
        className={`${stickyAllowed ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-900/5 dark:shadow-black/20' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-3 group relative z-10"
            >
              {settings?.logoUrl ? (
                <img 
                  src={toAbsoluteImageUrl(settings.logoUrl)} 
                  alt={settings.siteName || 'Logo'} 
                  className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all group-hover:rotate-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent">
                    {settings?.siteName || 'Blog'}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/"
                className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 group ${
                  isActive('/')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accueil
                </span>
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive('/')
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                }`} />
              </Link>

              <Link
                href="/articles"
                className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 group ${
                  isActive('/articles')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Articles
                </span>
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive('/articles')
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                }`} />
              </Link>

              <Link
                href="/auteurs"
                className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 group ${
                  isActive('/auteurs') || pathname?.startsWith('/auteurs/')
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Auteurs
                </span>
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive('/auteurs') || pathname?.startsWith('/auteurs/')
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                }`} />
              </Link>

              {/* Members page has been removed per request - link intentionally omitted */}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Bell (if logged in) */}
              {user && <NotificationBell />}

              {/* User Menu or Login */}
              {user ? (
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-200 dark:ring-blue-900 group-hover:ring-4 transition-all shadow-md">
                        {user.displayName?.charAt(0) || user.email.charAt(0)}
                      </div>
                      {user.role?.includes('ADMIN') && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-900/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {user.displayName?.charAt(0) || user.email.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {user.displayName || 'Utilisateur'}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href={dashboardPath}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Settings className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              Tableau de bord
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Gérer vos contenus
                            </div>
                          </div>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group mt-1"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-red-600 dark:text-red-400 text-sm">
                              Déconnexion
                            </div>
                            <div className="text-xs text-red-500 dark:text-red-400">
                              À bientôt !
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <User className="w-4 h-4" />
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
  {/* Large spacer to create top white space across all pages as requested */}
  {stickyAllowed && <div className="h-24 md:h-28" aria-hidden="true" />}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" onClick={() => setIsSearchOpen(false)}>
          <div className="min-h-screen flex items-start justify-center pt-20 px-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 relative" ref={searchContainerRef} onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
                aria-label="Fermer la recherche"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleSearch} className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher des articles..."
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      aria-label="Effacer la recherche"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  {suggestions.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSuggestionClick(article.id)}
                      className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left flex gap-4 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      {(article as any).coverImage && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                          <img src={toAbsoluteImageUrl((article as any).coverImage)} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                          {article.title}
                        </div>
                        {(article as any).excerpt && (
                          <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {(article as any).excerpt}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Espace vide en haut du menu */}
            <div className="h-20" aria-hidden="true"></div>
            
            <div className="p-6 pt-4 space-y-4">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Home className="w-5 h-5" />
                <span className="font-semibold">Accueil</span>
              </Link>
              <Link href="/articles" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <FileText className="w-5 h-5" />
                <span className="font-semibold">Articles</span>
              </Link>
              <Link href="/auteurs" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Auteurs</span>
              </Link>
              {/* Members removed */}
              
              {user ? (
                <>
                  <Link href={dashboardPath} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold">Dashboard</span>
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg">
                  <User className="w-5 h-5" />
                  <span>Connexion</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
