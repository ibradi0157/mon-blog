"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

// Dev-only logger to avoid noisy logs in production
const __DEV__ = process.env.NODE_ENV !== "production";
const devLog = (...args: any[]) => {
  if (__DEV__) console.log(...args);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Debug logging (dev only)
    devLog('ThemeToggle: Applying theme', { theme, systemPrefersDark, mounted });

    if (theme === "system") {
      if (systemPrefersDark) {
        root.classList.add("dark");
        devLog('ThemeToggle: Added dark class (system + dark preference)');
      } else {
        root.classList.remove("dark");
        devLog('ThemeToggle: Removed dark class (system + light preference)');
      }
    } else if (theme === "dark") {
      root.classList.add("dark");
      devLog('ThemeToggle: Added dark class (explicit dark)');
    } else {
      root.classList.remove("dark");
      devLog('ThemeToggle: Removed dark class (explicit light)');
    }

    // Verify the class was applied (dev only)
    devLog('ThemeToggle: HTML classes after change:', root.className);

    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />;
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "system":
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Mode clair";
      case "dark":
        return "Mode sombre";
      case "system":
        return "Système";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors duration-200 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      title={getLabel()}
      aria-label={`Changer le thème (actuellement: ${getLabel()})`}
    >
      <div className="transition-transform duration-200 hover:scale-110">
        {getIcon()}
      </div>
    </button>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme on first load
    const savedTheme = localStorage.getItem("theme") as Theme;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (!savedTheme) {
      localStorage.setItem("theme", "system");
    }
    
    const theme = savedTheme || "system";
    const root = document.documentElement;
    
    if (theme === "system") {
      if (systemPrefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return <>{children}</>;
}
