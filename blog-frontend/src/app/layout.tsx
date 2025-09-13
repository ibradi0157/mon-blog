import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import "quill/dist/quill.snow.css";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { ThemeProvider } from "@/app/components/ThemeToggle";
import { NavBar } from "@/app/components/NavBar";
import { ServiceWorkerRegistration } from "@/app/components/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: {
    default: "Mon Blog - Plateforme de Publication Moderne",
    template: "%s | Mon Blog"
  },
  description: "Découvrez des articles de qualité sur la technologie, l'innovation et bien plus encore. Une plateforme de blog moderne et intuitive.",
  keywords: ["blog", "articles", "technologie", "innovation", "publication"],
  authors: [{ name: "Mon Blog Team" }],
  creator: "Mon Blog",
  publisher: "Mon Blog",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    title: "Mon Blog - Plateforme de Publication Moderne",
    description: "Découvrez des articles de qualité sur la technologie, l'innovation et bien plus encore.",
    siteName: "Mon Blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mon Blog - Plateforme de Publication Moderne",
    description: "Découvrez des articles de qualité sur la technologie, l'innovation et bien plus encore.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Prevent theme flash: set initial dark class before hydration */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function() { try { var s = localStorage.getItem('theme'); var m = window.matchMedia('(prefers-color-scheme: dark)').matches; var t = s || 'system'; var r = document.documentElement; if (t === 'dark' || (t === 'system' && m)) { r.classList.add('dark'); } else { r.classList.remove('dark'); } } catch (e) {} })();`,
          }}
        />
      </head>
      <body suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-slate-900 dark:text-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ServiceWorkerRegistration />
              <div className="flex flex-col min-h-screen">
                <NavBar />
                <main className="flex-1">
                  {children}
                </main>
                <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mon Blog</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">
                          Une plateforme moderne pour partager des idées, découvrir du contenu de qualité et connecter avec une communauté passionnée.
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Navigation</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Accueil</Link></li>
                          <li><Link href="/articles" className="hover:text-slate-900 dark:hover:text-white transition-colors">Articles</Link></li>
                          <li><Link href="/categories" className="hover:text-slate-900 dark:hover:text-white transition-colors">Catégories</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Légal</h4>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                          <li><Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Confidentialité</Link></li>
                          <li><Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Conditions</Link></li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                      <p>&copy; {new Date().getFullYear()} Mon Blog. Tous droits réservés.</p>
                    </div>
                  </div>
                </footer>
              </div>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
