'use client';

import React from 'react';
import { Type, Grid3X3, Code, Space, Megaphone, Tag, Zap } from 'lucide-react';
import type { Section } from '../../services/homepage';

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'hero' | 'content' | 'media' | 'action';
  section: Section;
  preview: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  // Hero Templates
  {
    id: 'hero-gradient',
    name: 'Hero Gradient',
    description: 'Section hero avec fond dégradé coloré',
    icon: Type,
    category: 'hero',
    preview: '/previews/hero-gradient.jpg',
    section: {
      kind: 'hero',
      title: 'Bienvenue sur notre blog',
      subtitle: 'Découvrez du contenu de qualité, des articles inspirants et rejoignez notre communauté passionnée.',
      imageUrl: null
    }
  },
  {
    id: 'hero-image',
    name: 'Hero avec Image',
    description: 'Section hero avec image de fond personnalisée',
    icon: Type,
    category: 'hero',
    preview: '/previews/hero-image.jpg',
    section: {
      kind: 'hero',
      title: 'Créez l\'extraordinaire',
      subtitle: 'Transformez vos idées en réalité avec nos outils et notre expertise.',
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1920&q=80'
    }
  },
  
  // Content Templates
  {
    id: 'articles-grid-3',
    name: 'Grille 3 Colonnes',
    description: 'Affichage des articles en grille de 3 colonnes',
    icon: Grid3X3,
    category: 'content',
    preview: '/previews/articles-grid-3.jpg',
    section: {
      kind: 'featuredGrid',
      title: 'Articles à la Une',
      articleIds: []
    }
  },
  {
    id: 'categories-showcase',
    name: 'Vitrine Catégories',
    description: 'Présentation élégante des catégories du blog',
    icon: Tag,
    category: 'content',
    preview: '/previews/categories-showcase.jpg',
    section: {
      kind: 'categoryGrid',
      title: 'Explorez nos Catégories',
      categoryIds: []
    }
  },
  
  // Media Templates
  {
    id: 'custom-content',
    name: 'Contenu Personnalisé',
    description: 'Section HTML personnalisable pour du contenu unique',
    icon: Code,
    category: 'media',
    preview: '/previews/custom-content.jpg',
    section: {
      kind: 'html',
      html: `<div class="text-center py-16 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl">
  <h3 class="text-4xl font-bold mb-4">Contenu Spécial</h3>
  <p class="text-xl opacity-90 max-w-2xl mx-auto">
    Ajoutez votre contenu personnalisé ici. Utilisez Tailwind CSS pour créer des designs uniques.
  </p>
</div>`
    }
  },
  
  // Action Templates
  {
    id: 'newsletter-signup',
    name: 'Inscription Newsletter',
    description: 'Appel à l\'action pour l\'inscription à la newsletter',
    icon: Megaphone,
    category: 'action',
    preview: '/previews/newsletter-cta.jpg',
    section: {
      kind: 'cta',
      title: 'Restez informé',
      text: 'Recevez nos derniers articles directement dans votre boîte mail. Pas de spam, juste du contenu de qualité.',
      buttonLabel: 'S\'abonner à la newsletter',
      buttonHref: '/newsletter'
    }
  },
  {
    id: 'join-community',
    name: 'Rejoindre la Communauté',
    description: 'Invitation à rejoindre la communauté',
    icon: Zap,
    category: 'action',
    preview: '/previews/community-cta.jpg',
    section: {
      kind: 'cta',
      title: 'Rejoignez Notre Communauté',
      text: 'Plus de 10 000 lecteurs nous font confiance. Découvrez pourquoi ils choisissent notre contenu.',
      buttonLabel: 'Nous Rejoindre',
      buttonHref: '/register'
    }
  }
];

interface SectionTemplatesProps {
  onSelectTemplate: (template: SectionTemplate) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Grid3X3 },
  { id: 'hero', label: 'Hero', icon: Type },
  { id: 'content', label: 'Contenu', icon: Grid3X3 },
  { id: 'media', label: 'Média', icon: Code },
  { id: 'action', label: 'Action', icon: Megaphone },
];

export function SectionTemplates({ onSelectTemplate, activeCategory, onCategoryChange }: SectionTemplatesProps) {
  const filteredTemplates = activeCategory === 'all' 
    ? SECTION_TEMPLATES 
    : SECTION_TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTemplates.map(template => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="group w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors flex-shrink-0">
                  <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {CATEGORIES.find(c => c.id === template.category)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun template dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
