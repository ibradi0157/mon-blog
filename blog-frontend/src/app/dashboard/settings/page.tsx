"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Shield, 
  Palette, 
  Database,
  Bell,
  Users,
  FileText,
  Server
} from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

// Strongly type settings used in this page
type SettingsShape = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  enableComments: boolean;
  moderateComments: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  enableNotifications: boolean;
  notificationEmail: string;
};

const defaultSettings: SettingsShape = {
  siteName: "",
  siteDescription: "",
  siteUrl: "",
  adminEmail: "",
  allowRegistration: false,
  requireEmailVerification: false,
  enableComments: false,
  moderateComments: false,
  maxFileSize: 10,
  allowedFileTypes: [],
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  enableNotifications: false,
  notificationEmail: "",
};

// Mock settings service - you'll need to implement the actual API
const getSettings = async () => {
  // This should call your actual settings API
  return {
    success: true,
    data: {
      siteName: "Mon Blog",
      siteDescription: "Un blog moderne et professionnel",
      siteUrl: "https://monblog.com",
      adminEmail: "admin@monblog.com",
      allowRegistration: true,
      requireEmailVerification: true,
      enableComments: true,
      moderateComments: false,
      maxFileSize: 10,
      allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp"],
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      enableNotifications: true,
      notificationEmail: "notifications@monblog.com"
    }
  };
};

const updateSettings = async (settings: any) => {
  // This should call your actual settings update API
  return { success: true, data: settings };
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  
  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: getSettings,
  });

  const [formData, setFormData] = useState<SettingsShape>(settingsQuery.data?.data ?? defaultSettings);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  // Sync state when query resolves
  useEffect(() => {
    if (settingsQuery.data?.data) {
      setFormData(settingsQuery.data.data as SettingsShape);
    }
  }, [settingsQuery.data]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                URL du site
              </label>
              <Input
                type="url"
                value={formData.siteUrl || ""}
                onChange={(e) => handleInputChange("siteUrl", e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description du site
              </label>
              <textarea
                rows={3}
                value={formData.siteDescription || ""}
                onChange={(e) => handleInputChange("siteDescription", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestion des utilisateurs</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Autoriser l'inscription
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permettre aux nouveaux utilisateurs de créer un compte
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allowRegistration || false}
                onChange={(e) => handleInputChange("allowRegistration", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Vérification email requise
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Les utilisateurs doivent vérifier leur email
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.requireEmailVerification || false}
                onChange={(e) => handleInputChange("requireEmailVerification", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Contenu et commentaires</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Activer les commentaires
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permettre aux utilisateurs de commenter les articles
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.enableComments || false}
                onChange={(e) => handleInputChange("enableComments", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Modération des commentaires
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Les commentaires nécessitent une approbation
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.moderateComments || false}
                onChange={(e) => handleInputChange("moderateComments", e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Taille max des fichiers (MB)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.maxFileSize || 10}
                  onChange={(e) => handleInputChange("maxFileSize", parseInt((e.target as HTMLInputElement).value))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Types de fichiers autorisés
                </label>
                <Input
                  type="text"
                  value={formData.allowedFileTypes?.join(", ") || ""}
                  onChange={(e) => handleInputChange("allowedFileTypes", e.target.value.split(", ").filter(Boolean))}
                  placeholder="jpg, png, gif, webp"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Mail className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configuration email</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email administrateur
              </label>
              <Input
                type="email"
                value={formData.adminEmail || ""}
                onChange={(e) => handleInputChange("adminEmail", e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email notifications
              </label>
              <Input
                type="email"
                value={formData.notificationEmail || ""}
                onChange={(e) => handleInputChange("notificationEmail", e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Serveur SMTP
              </label>
              <Input
                type="text"
                value={formData.smtpHost || ""}
                onChange={(e) => handleInputChange("smtpHost", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Port SMTP
              </label>
              <Input
                type="number"
                value={formData.smtpPort || 587}
                onChange={(e) => handleInputChange("smtpPort", parseInt((e.target as HTMLInputElement).value))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Utilisateur SMTP
              </label>
              <Input
                type="text"
                value={formData.smtpUser || ""}
                onChange={(e) => handleInputChange("smtpUser", e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mot de passe SMTP
              </label>
              <Input
                type="password"
                value={formData.smtpPassword || ""}
                onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer les paramètres"}
          </Button>
        </div>
      </form>

      {updateMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ Paramètres sauvegardés avec succès
        </div>
      )}
    </div>
  );
}
