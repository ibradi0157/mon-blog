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
import { SiteSettingsProvider } from "@/app/providers/SiteSettingsProvider";
import { FaviconUpdater } from "@/app/components/FaviconUpdater";
import { DynamicFooter } from "@/app/components/DynamicFooter";

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
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <SiteSettingsProvider>
                <ServiceWorkerRegistration />
                <FaviconUpdater />
                <div className="flex flex-col min-h-screen">
                  <NavBar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <DynamicFooter />
                </div>
              </SiteSettingsProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
