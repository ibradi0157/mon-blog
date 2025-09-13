"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useState } from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

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
    <div className="grid grid-cols-1 md:grid-template-columns:220px_1fr gap-6 min-h-[70vh]">
      <aside className="border-r border-black/10 dark:border-white/10 p-4 space-y-4 md:sticky md:top-24 h-max">
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
  );
}
