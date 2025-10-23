'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getPublicFooter, type FooterSection, type FooterLink } from '@/app/services/footer';

// --- Color helpers: compute dark variants if API doesn't provide them ---
function clamp(n: number, min = 0, max = 255) { return Math.max(min, Math.min(max, n)); }
function parseColor(input?: string): { r: number; g: number; b: number } | null {
  if (!input) return null;
  const s = input.trim();
  // #RRGGBB or #RGB
  const hexMatch = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let h = hexMatch[1].toLowerCase();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  // rgb() or rgba()
  const rgbMatch = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      const r = clamp(Number(parts[0]));
      const g = clamp(Number(parts[1]));
      const b = clamp(Number(parts[2]));
      return { r, g, b };
    }
  }
  return null;
}
function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const h = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function darken(input?: string, factor = 0.85): string | undefined {
  const rgb = parseColor(input);
  if (!rgb) return input;
  return toHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}
function lighten(input?: string, factor = 1.15): string | undefined {
  const rgb = parseColor(input);
  if (!rgb) return input;
  return toHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}

export function DynamicFooter() {
  const footerQuery = useQuery({
    queryKey: ['public-footer'],
    queryFn: getPublicFooter,
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const footer = footerQuery.data;

  // Prepare CSS variables for both light and dark variants
  const styleVars = useMemo(() => {
    if (!footer) return undefined as React.CSSProperties | undefined;
    const bg = footer.backgroundColor || undefined;
    const fg = footer.textColor || undefined;
    const bgDark = (footer as any).backgroundColorDark || darken(bg, 0.6);
    const fgDark = (footer as any).textColorDark || lighten(fg, 1.4);
    return {
      ['--footer-bg' as any]: bg,
      ['--footer-fg' as any]: fg,
      ['--footer-bg-dark' as any]: bgDark,
      ['--footer-fg-dark' as any]: fgDark,
    } as React.CSSProperties;
  }, [footer]);

  // Show default footer while loading or on error
  if (footerQuery.isLoading || footerQuery.isError || !footer) {
    return (
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mon Blog</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-md">
                Une plateforme moderne pour partager des idées, découvrir du contenu de qualité et connecter avec une communauté passionnée.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Accueil</Link></li>
                <li><Link href="/articles" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Articles</Link></li>
                <li><Link href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Catégories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} Mon Blog. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    );
  }

  // Render dynamic footer
  return (
    <footer
      className="border-t border-slate-200 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300"
      style={{
        ...styleVars,
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--footer-fg)',
      }}
      data-dynamic-footer="true"
    >
      <style jsx>{`
        footer[data-dynamic-footer="true"] {
          background-color: var(--footer-bg, white);
          color: var(--footer-fg, rgb(71, 85, 105));
        }
        .dark footer[data-dynamic-footer="true"] {
          background-color: var(--footer-bg-dark, rgb(15, 23, 42));
          color: var(--footer-fg-dark, rgb(226, 232, 240));
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Main description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 opacity-100">{footer.title}</h3>
            <p className="mb-4 max-w-md opacity-90">{footer.description}</p>
          </div>
          
          {/* Dynamic sections */}
          {footer.sections.map((section: FooterSection, index: number) => (
            <div key={index}>
              <h4 className="text-sm font-semibold mb-4 opacity-100">{section.title}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                {section.links.map((link: FooterLink, linkIndex: number) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a 
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-100 hover:underline transition-all flex items-center"
                      >
                        {link.text}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <Link 
                        href={link.href} 
                        className="hover:opacity-100 hover:underline transition-all"
                      >
                        {link.text}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="border-t border-current border-opacity-20 mt-8 pt-8 text-center text-sm opacity-70">
          <p>{footer.copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}
