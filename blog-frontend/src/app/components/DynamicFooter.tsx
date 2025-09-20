'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getPublicFooter, type FooterSection, type FooterLink } from '@/app/services/footer';

export function DynamicFooter() {
  const footerQuery = useQuery({
    queryKey: ['public-footer'],
    queryFn: getPublicFooter,
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const footer = footerQuery.data;

  // Show default footer while loading or on error
  if (footerQuery.isLoading || footerQuery.isError || !footer) {
    return (
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
    );
  }

  // Render dynamic footer
  return (
    <footer 
      className="border-t border-slate-200 dark:border-slate-700 backdrop-blur-sm"
      style={{ 
        backgroundColor: footer.backgroundColor, 
        color: footer.textColor 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Main description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">{footer.title}</h3>
            <p className="mb-4 max-w-md opacity-90">{footer.description}</p>
          </div>
          
          {/* Dynamic sections */}
          {footer.sections.map((section: FooterSection, index: number) => (
            <div key={index}>
              <h4 className="text-sm font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm opacity-80">
                {section.links.map((link: FooterLink, linkIndex: number) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a 
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-100 transition-opacity flex items-center"
                      >
                        {link.text}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <Link 
                        href={link.href} 
                        className="hover:opacity-100 transition-opacity"
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
