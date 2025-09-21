'use client';

import React, { useEffect, useRef } from 'react';
import type { HomepageConfig, Section } from '../../services/homepage';
import type { Article, Category } from '../../services/articles';
import { toAbsoluteImageUrl } from '../../lib/api';

interface IframePreviewProps {
  config: HomepageConfig;
  articles: Article[];
  categories: Category[];
  device: 'desktop' | 'mobile';
}

export function IframePreview({ config, articles, categories, device }: IframePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generatePreviewHTML = () => {
    const sections = config.sections || [];
    
    const sectionsHTML = sections.map((section) => {
      return renderSectionHTML(section, articles, categories);
    }).join('');

    return `
<!DOCTYPE html>
<html lang="fr" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aperçu de la page d'accueil</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <div class="min-h-screen">
    ${sectionsHTML}
  </div>
  
  <script>
    // Add smooth animations
    document.querySelectorAll('img').forEach(img => {
      img.onload = () => img.classList.add('opacity-100');
      img.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    });
  </script>
</body>
</html>`;
  };

  const renderSectionHTML = (section: Section, articles: Article[], categories: Category[]): string => {
    switch (section.kind) {
      case 'hero':
        const hero = section as any;
        const heroImg = toAbsoluteImageUrl(hero.imageUrl) || hero.imageUrl;
        return `
          <section class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
            ${heroImg ? `
              <div class="absolute inset-0 z-0">
                <img src="${heroImg}" alt="Hero background" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
            ` : ''}
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
              ${hero.title ? `<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">${hero.title}</h1>` : ''}
              ${hero.subtitle ? `<p class="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto">${hero.subtitle}</p>` : ''}
            </div>
          </section>
        `;

      case 'featuredGrid':
        const featured = section as any;
        const featuredArticles = (featured.articleIds || [])
          .map((id: string) => articles.find(a => a.id === id))
          .filter(Boolean)
          .slice(0, 6);
        
        return `
          <section class="py-16 bg-white dark:bg-gray-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              ${featured.title ? `<h2 class="text-3xl font-bold text-center mb-12">${featured.title}</h2>` : ''}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${featuredArticles.map((article: any) => {
                  const cover = toAbsoluteImageUrl(article.coverUrl) || article.coverUrl;
                  const dateStr = new Date(article.publishedAt || article.createdAt).toLocaleDateString('fr-FR');
                  return `
                  <article class="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                      ${cover ? `
                        <img src="${cover}" alt="${article.title}" class="w-full h-48 object-cover">
                      ` : `
                        <div class="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                      `}
                    </div>
                    <div class="px-6 p-6">
                      <h3 class="text-xl font-semibold mb-3 line-clamp-2">${article.title}</h3>
                      ${article.excerpt ? `<p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">${article.excerpt}</p>` : ''}
                      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>${(article.author && article.author.displayName) ? article.author.displayName : 'Auteur'}</span>
                        <span>${dateStr}</span>
                      </div>
                    </div>
                  </article>
                `}).join('')}
              </div>
            </div>
          </section>
        `;

      case 'categoryGrid':
        const categorySection = section as any;
        const selectedCategories = (categorySection.categoryIds || [])
          .map((id: string) => categories.find(c => c.id === id))
          .filter(Boolean);
          
        const colors = [
          'from-blue-500 to-blue-600',
          'from-emerald-500 to-emerald-600', 
          'from-purple-500 to-purple-600',
          'from-rose-500 to-rose-600',
          'from-amber-500 to-amber-600',
          'from-cyan-500 to-cyan-600',
        ];
        
        return `
          <section class="py-16 bg-gray-50 dark:bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              ${categorySection.title ? `<h2 class="text-3xl font-bold text-center mb-12">${categorySection.title}</h2>` : ''}
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                ${selectedCategories.map((category: any, index: number) => `
                  <div class="group cursor-pointer">
                    <div class="bg-gradient-to-r ${colors[index % colors.length]} rounded-xl p-6 text-center text-white hover:scale-105 transition-transform duration-200">
                      <h3 class="text-lg font-semibold">${category.name}</h3>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </section>
        `;

      case 'html':
        const htmlSection = section as any;
        return `
          <section class="py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              ${htmlSection.html || ''}
            </div>
          </section>
        `;

      case 'spacer':
        const spacer = section as any;
        const height = spacer.size === 'sm' ? 'py-4' : spacer.size === 'md' ? 'py-8' : 'py-16';
        return `<div class="${height}"></div>`;

      case 'cta':
        const cta = section as any;
        return `
          <section class="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              ${cta.title ? `<h2 class="text-3xl sm:text-4xl font-bold mb-4">${cta.title}</h2>` : ''}
              ${cta.text ? `<p class="text-xl opacity-90 mb-8">${cta.text}</p>` : ''}
              ${cta.buttonLabel ? `
                <a href="${cta.buttonHref || '#'}" class="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  ${cta.buttonLabel}
                </a>
              ` : ''}
            </div>
          </section>
        `;

      default:
        return '';
    }
  };

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const html = generatePreviewHTML();
      
      iframe.onload = () => {
        const doc = iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      };
      
      // Trigger reload
      iframe.src = 'about:blank';
    }
  }, [config, articles, categories]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${
      device === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
    }`}>
      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="flex-1 text-center">
            <div className="bg-white dark:bg-gray-600 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-300 inline-block">
              monblog.com
            </div>
          </div>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-96 border-none"
        title="Homepage Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
