'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  Link, 
  Palette,
  Eye,
  Settings
} from 'lucide-react';
import { getAdminFooter, updateFooter, resetFooter, type FooterData, type FooterSection, type FooterLink } from '@/app/services/footer';

export default function FooterManagementPage() {
  const qc = useQueryClient();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fetch current footer data
  const footerQuery = useQuery({
    queryKey: ['admin-footer'],
    queryFn: getAdminFooter,
    select: (response) => response.data,
  });

  const [form, setForm] = useState<FooterData>(() => ({
    title: '',
    description: '',
    sections: [],
    copyrightText: '',
    showSocialLinks: false,
    socialLinks: {},
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    darkBackgroundColor: '#0f172a',
    darkTextColor: '#e2e8f0',
  }));

  // Update form when data loads
  React.useEffect(() => {
    if (footerQuery.data) {
      setForm(footerQuery.data);
    }
  }, [footerQuery.data]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateFooter,
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['admin-footer'] });
      qc.invalidateQueries({ queryKey: ['public-footer'] });
      alert('Footer mis à jour avec succès !');
    },
    onError: (error) => {
      console.error('Error updating footer:', error);
      alert('Erreur lors de la mise à jour du footer');
    }
  });

  const resetMutation = useMutation({
    mutationFn: resetFooter,
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['admin-footer'] });
      qc.invalidateQueries({ queryKey: ['public-footer'] });
      alert('Footer réinitialisé avec succès !');
    },
    onError: (error) => {
      console.error('Error resetting footer:', error);
      alert('Erreur lors de la réinitialisation du footer');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le footer aux valeurs par défaut ?')) {
      resetMutation.mutate();
    }
  };

  const addSection = () => {
    setForm(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: 'Nouvelle section', links: [] }
      ]
    }));
  };

  const updateSection = (index: number, section: FooterSection) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === index ? section : s)
    }));
  };

  const removeSection = (index: number) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const addLink = (sectionIndex: number) => {
    const newLink: FooterLink = { text: 'Nouveau lien', href: '/', external: false };
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, links: [...section.links, newLink] }
          : section
      )
    }));
  };

  const updateLink = (sectionIndex: number, linkIndex: number, link: FooterLink) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { 
              ...section, 
              links: section.links.map((l, j) => j === linkIndex ? link : l) 
            }
          : section
      )
    }));
  };

  const removeLink = (sectionIndex: number, linkIndex: number) => {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, links: section.links.filter((_, j) => j !== linkIndex) }
          : section
      )
    }));
  };

  if (footerQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion du Footer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Personnalisez l'apparence et le contenu du pied de page de votre site
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isPreviewMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Mode Édition' : 'Aperçu'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {isPreviewMode ? (
        // Preview Mode
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Aperçu du Footer
          </h3>
          
          {/* Footer Preview */}
          <div 
            className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: form.backgroundColor,
              color: form.textColor 
            }}
          >
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">{form.title}</h3>
                  <p className="mb-4 max-w-md opacity-80">{form.description}</p>
                </div>
                
                {form.sections.map((section, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-semibold mb-4">{section.title}</h4>
                    <ul className="space-y-2 text-sm opacity-80">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a 
                            href={link.href} 
                            className="hover:opacity-100 transition-opacity flex items-center"
                            target={link.external ? '_blank' : '_self'}
                            rel={link.external ? 'noopener noreferrer' : ''}
                          >
                            {link.text}
                            {link.external && <ExternalLink className="w-3 h-3 ml-1" />}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-current border-opacity-20 mt-8 pt-8 text-center text-sm opacity-60">
                <p>{form.copyrightText}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Informations de base
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Titre du site
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mon Blog"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Une courte description de votre site..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Texte de copyright
                    </label>
                    <input
                      type="text"
                      value={form.copyrightText}
                      onChange={(e) => setForm(prev => ({ ...prev, copyrightText: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="© 2024 Mon Blog. Tous droits réservés."
                    />
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Link className="w-5 h-5 mr-2" />
                    Sections de liens
                  </h3>
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une section
                  </button>
                </div>
                
                <div className="space-y-6">
                  {form.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(sectionIndex, { ...section, title: e.target.value })}
                          className="text-lg font-medium bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-white"
                          placeholder="Titre de la section"
                        />
                        <button
                          type="button"
                          onClick={() => removeSection(sectionIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {section.links.map((link, linkIndex) => (
                          <div key={linkIndex} className="flex items-center space-x-3">
                            <input
                              type="text"
                              value={link.text}
                              onChange={(e) => updateLink(sectionIndex, linkIndex, { ...link, text: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              placeholder="Texte du lien"
                            />
                            <input
                              type="text"
                              value={link.href}
                              onChange={(e) => updateLink(sectionIndex, linkIndex, { ...link, href: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                              placeholder="URL du lien"
                            />
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={link.external || false}
                                onChange={(e) => updateLink(sectionIndex, linkIndex, { ...link, external: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Externe</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeLink(sectionIndex, linkIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => addLink(sectionIndex)}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                          Ajouter un lien
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Appearance Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Apparence
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur de fond
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={form.backgroundColor}
                        onChange={(e) => setForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={form.backgroundColor}
                        onChange={(e) => setForm(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur du texte
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={form.textColor}
                        onChange={(e) => setForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={form.textColor}
                        onChange={(e) => setForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="#1e293b"
                      />
                    </div>
                  </div>
                </div>

                {/* Dark Mode Colors */}
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-600">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    🌙 Couleurs Mode Sombre
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fond (Dark Mode)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={form.darkBackgroundColor || '#0f172a'}
                          onChange={(e) => setForm(prev => ({ ...prev, darkBackgroundColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={form.darkBackgroundColor || '#0f172a'}
                          onChange={(e) => setForm(prev => ({ ...prev, darkBackgroundColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="#0f172a"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Texte (Dark Mode)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={form.darkTextColor || '#e2e8f0'}
                          onChange={(e) => setForm(prev => ({ ...prev, darkTextColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="text"
                          value={form.darkTextColor || '#e2e8f0'}
                          onChange={(e) => setForm(prev => ({ ...prev, darkTextColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="#e2e8f0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Save Button */}
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
