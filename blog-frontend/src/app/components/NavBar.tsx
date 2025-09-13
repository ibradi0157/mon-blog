"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  FileText, 
  Settings, 
  User, 
  LogOut,
  Moon,
  Sun,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { ThemeToggle } from './ThemeToggle';
import { useRouter } from "next/navigation";
import { suggestPublicArticles, type Article } from "../services/articles";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch for suggestions
  useEffect(() => {
    setHighlightedIndex(-1);
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

  // Click outside to close suggestions
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function goToResults(q: string) {
    const target = `/articles?search=${encodeURIComponent(q.trim())}`;
    router.push(target);
    setShowSuggestions(false);
  }

  function goToArticle(id: string) {
    router.push(`/article/${id}`);
    setShowSuggestions(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const hasAny = suggestions.length > 0;
    if (e.key === 'ArrowDown' && hasAny) {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && hasAny) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        goToArticle(suggestions[highlightedIndex].id);
      } else if (searchQuery.trim()) {
        goToResults(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 safe-px">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">MB</span>
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">Mon Blog</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Link>
            <Link href="/articles" className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <FileText className="w-4 h-4" />
              <span>Articles</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher des articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />

              {showSuggestions && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                  <ul className="max-h-80 overflow-auto py-1">
                    {loadingSuggestions && (
                      <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Recherche…</li>
                    )}
                    {!loadingSuggestions && suggestions.length === 0 && (
                      <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Aucun résultat</li>
                    )}
                    {!loadingSuggestions && suggestions.map((s, idx) => (
                      <li
                        key={s.id}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${idx === highlightedIndex ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); goToArticle(s.id); }}
                      >
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{s.title}</span>
                      </li>
                    ))}
                  </ul>
                  {searchQuery.trim() && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm border-t border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      onMouseDown={(e) => { e.preventDefault(); goToResults(searchQuery); }}
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      Voir tous les résultats pour “{searchQuery.trim()}”
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {!user ? (
              <div className="hidden md:flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Se connecter
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3 relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.displayName?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                  {(user.role === 'PRIMARY_ADMIN' || user.role === 'SECONDARY_ADMIN') && (
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">Admin</span>
                  )}
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                    <div className="py-2">
                      <Link
                        href={dashboardPath}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Tableau de bord</span>
                      </Link>
                    </div>
                  </div>
                )}

                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Déconnexion</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="relative" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher des articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />

              {showSuggestions && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                  <ul className="max-h-80 overflow-auto py-1">
                    {loadingSuggestions && (
                      <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Recherche…</li>
                    )}
                    {!loadingSuggestions && suggestions.length === 0 && (
                      <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Aucun résultat</li>
                    )}
                    {!loadingSuggestions && suggestions.map((s, idx) => (
                      <li
                        key={s.id}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${idx === highlightedIndex ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); goToArticle(s.id); setIsSearchOpen(false); }}
                      >
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{s.title}</span>
                      </li>
                    ))}
                  </ul>
                  {searchQuery.trim() && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm border-t border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      onMouseDown={(e) => { e.preventDefault(); goToResults(searchQuery); setIsSearchOpen(false); }}
                    >
                      <Search className="w-4 h-4 text-slate-400" />
                      Voir tous les résultats pour “{searchQuery.trim()}”
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="space-y-4">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </Link>
              <Link 
                href="/articles" 
                className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="w-4 h-4" />
                <span>Articles</span>
              </Link>
              
              {user?.role === "PRIMARY_ADMIN" && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
              
              {user?.role === "MEMBER" && (
                <Link 
                  href="/member" 
                  className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Membre</span>
                </Link>
              )}
              {user?.role === "SIMPLE_USER" && (
                <Link 
                  href="/user" 
                  className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Mon espace</span>
                </Link>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                {!user ? (
                  <div className="space-y-3">
                    <Link 
                      href="/login" 
                      className="block text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Se connecter
                    </Link>
                    <Link 
                      href="/register" 
                      className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      S'inscrire
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.displayName?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.displayName || user.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(user.role === "PRIMARY_ADMIN" || user.role === "SECONDARY_ADMIN") ? "Administrateur" : user.role === "MEMBER" ? "Membre" : "Utilisateur"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
