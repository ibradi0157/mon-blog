"use client";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Palette, 
  Image,
  Upload,
  Share2,
  Search,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { 
  getAdminSiteSettings, 
  updateSiteSettings, 
  uploadSiteLogo, 
  uploadSiteFavicon,
  resetSiteSettingsToDefaults,
  type SiteSettings,
  type UpdateSiteSettingsPayload
} from "@/app/services/site-settings";
import { toast } from "sonner";
import { toAbsoluteImageUrl } from "@/app/lib/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  const settingsQuery = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: getAdminSiteSettings,
  });

  const [formData, setFormData] = useState<Partial<SiteSettings>>({});

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSiteSettingsPayload) => updateSiteSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
      toast.success("Paramètres mis à jour avec succès");
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la mise à jour des paramètres");
      console.error("Settings update error:", error);
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: uploadSiteLogo,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
      toast.success("Logo mis à jour avec succès");
      setFormData(prev => ({ ...prev, logoUrl: result.data.logoUrl }));
    },
    onError: () => toast.error("Erreur lors du téléversement du logo"),
  });

  const faviconUploadMutation = useMutation({
    mutationFn: uploadSiteFavicon,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
      toast.success("Favicon mis à jour avec succès");
      setFormData(prev => ({ ...prev, faviconUrl: result.data.faviconUrl }));
    },
    onError: () => toast.error("Erreur lors du téléversement du favicon"),
  });

  const resetMutation = useMutation({
    mutationFn: resetSiteSettingsToDefaults,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
      setFormData(result.data);
      toast.success("Paramètres réinitialisés aux valeurs par défaut");
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la réinitialisation des paramètres");
      console.error("Settings reset error:", error);
    },
  });

  // Sync state when query resolves
  useEffect(() => {
    if (settingsQuery.data?.data) {
      setFormData(settingsQuery.data.data);
    }
  }, [settingsQuery.data]);

  const handleInputChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) logoUploadMutation.mutate(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) faviconUploadMutation.mutate(file);
  };

  const handleReset = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser les paramètres aux valeurs par défaut ? Cette action est irréversible.")) {
      return;
    }
    resetMutation.mutate();
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres du site</h1>
            <p className="text-slate-600 dark:text-slate-400">Configuration générale de votre blog</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Paramètres généraux</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nom du site
              </label>
              <Input
                type="text"
                value={formData.siteName || ""}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
                placeholder="Mon Blog"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Thème par défaut
              </label>
              <select
                value={formData.defaultTheme || "light"}
                onChange={(e) => handleInputChange("defaultTheme", e.target.value as "light" | "dark" | "auto")}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description du site
              </label>
              <textarea
                rows={3}
                value={formData.siteDescription || ""}
                onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                placeholder="Un blog moderne et élégant"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Image className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Logo et favicon</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Logo du site
              </label>
              <div className="flex items-center space-x-4">
                {formData.logoUrl && (
                  <img 
                    src={toAbsoluteImageUrl(formData.logoUrl) || formData.logoUrl} 
                    alt="Logo" 
                    className="w-16 h-16 object-contain border rounded"
                  />
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploadMutation.isPending}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logoUploadMutation.isPending ? "Upload..." : "Changer le logo"}
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                {formData.faviconUrl && (
                  <img 
                    src={toAbsoluteImageUrl(formData.faviconUrl) || formData.faviconUrl} 
                    alt="Favicon" 
                    className="w-8 h-8 object-contain border rounded"
                  />
                )}
                <div>
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*,.ico"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={faviconUploadMutation.isPending}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {faviconUploadMutation.isPending ? "Upload..." : "Changer le favicon"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">SEO et métadonnées</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Titre meta (60 caractères max)
              </label>
              <Input
                type="text"
                maxLength={60}
                value={formData.metaTitle || ""}
                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                placeholder="Titre pour les moteurs de recherche"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mots-clés meta
              </label>
              <Input
                type="text"
                value={formData.metaKeywords || ""}
                onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
                placeholder="blog, article, actualités"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description meta (160 caractères max)
              </label>
              <textarea
                rows={2}
                maxLength={160}
                value={formData.metaDescription || ""}
                onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                placeholder="Description pour les moteurs de recherche"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Social & Contact */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Share2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Réseaux sociaux et contact</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email de contact
              </label>
              <Input
                type="email"
                value={formData.contactEmail || ""}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                placeholder="contact@monblog.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Handle Twitter
              </label>
              <Input
                type="text"
                value={formData.twitterHandle || ""}
                onChange={(e) => handleInputChange("twitterHandle", e.target.value)}
                placeholder="@monblog"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Facebook
              </label>
              <Input
                type="url"
                value={formData.socialFacebook || ""}
                onChange={(e) => handleInputChange("socialFacebook", e.target.value)}
                placeholder="https://facebook.com/monblog"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Twitter
              </label>
              <Input
                type="url"
                value={formData.socialTwitter || ""}
                onChange={(e) => handleInputChange("socialTwitter", e.target.value)}
                placeholder="https://twitter.com/monblog"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Instagram
              </label>
              <Input
                type="url"
                value={formData.socialInstagram || ""}
                onChange={(e) => handleInputChange("socialInstagram", e.target.value)}
                placeholder="https://instagram.com/monblog"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                LinkedIn
              </label>
              <Input
                type="url"
                value={formData.socialLinkedIn || ""}
                onChange={(e) => handleInputChange("socialLinkedIn", e.target.value)}
                placeholder="https://linkedin.com/company/monblog"
              />
            </div>
          </div>
        </div>

        {/* Footer section removed: managed elsewhere */}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {resetMutation.isPending ? "Réinitialisation..." : "Réinitialiser par défaut"}
          </Button>

          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer les paramètres"}
          </Button>
        </div>
      </form>
    </div>
  );
}
