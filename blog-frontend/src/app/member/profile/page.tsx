"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Save, 
  Camera, 
  Mail, 
  Calendar,
  MapPin,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Edit3,
  Shield
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";

// Strongly type profile used in this page
type ProfileShape = {
  id: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  website?: string | null;
  twitter?: string | null;
  github?: string | null;
  linkedin?: string | null;
  joinedAt: string;
  articlesCount: number;
  commentsCount: number;
};

const defaultProfile: ProfileShape = {
  id: "",
  email: "",
  displayName: "",
  bio: "",
  avatarUrl: null,
  location: "",
  website: "",
  twitter: "",
  github: "",
  linkedin: "",
  joinedAt: "1970-01-01T00:00:00Z",
  articlesCount: 0,
  commentsCount: 0,
};

// Mock profile service - you'll need to implement the actual API
const getUserProfile = async (userId: string) => {
  return {
    success: true,
    data: {
      id: userId,
      email: "user@example.com",
      displayName: "John Doe",
      bio: "Passionné de technologie et d'écriture",
      avatarUrl: null,
      location: "Paris, France",
      website: "https://johndoe.com",
      twitter: "@johndoe",
      github: "johndoe",
      linkedin: "johndoe",
      joinedAt: "2024-01-15T10:00:00Z",
      articlesCount: 12,
      commentsCount: 45
    }
  };
};

const updateUserProfile = async (userId: string, data: any) => {
  return { success: true, data };
};

const uploadAvatar = async (file: File) => {
  // Mock upload - implement actual upload logic
  return { success: true, data: { url: "/uploads/avatars/user-avatar.jpg" } };
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const profileQuery = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState<ProfileShape>(profileQuery.data?.data ?? defaultProfile);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUserProfile(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      setIsEditing(false);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (result) => {
      setFormData((prev: any) => ({ ...prev, avatarUrl: result.data.url }));
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const profile: ProfileShape = profileQuery.data?.data ?? defaultProfile;

  // Sync state when query resolves
  useEffect(() => {
    if (profileQuery.data?.data) {
      setFormData(profileQuery.data.data as ProfileShape);
    }
  }, [profileQuery.data]);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon Profil</h1>
              <p className="text-slate-600 dark:text-slate-400">Gérez vos informations personnelles</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? "Annuler" : "Modifier"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {profile.displayName?.charAt(0) || profile.email?.charAt(0)}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarMutation.isPending}
                    />
                  </label>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {profile.displayName || "Nom non défini"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{profile.email}</p>
              
              <div className="flex items-center justify-center space-x-1 mb-4">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Membre Vérifié</span>
              </div>

              {profile.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{profile.bio}</p>
              )}

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {profile.location && (
                  <div className="flex items-center justify-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {new Date(profile.joinedAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Articles publiés</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.articlesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Commentaires</span>
                <span className="font-semibold text-slate-900 dark:text-white">{profile.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Informations personnelles</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={formData.displayName || ""}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">L'email ne peut pas être modifié</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Biographie
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Parlez-nous de vous..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Paris, France"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Liens sociaux</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Site web
                  </label>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://monsite.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Twitter className="w-4 h-4 inline mr-2" />
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={formData.twitter || ""}
                    onChange={(e) => handleInputChange("twitter", e.target.value)}
                    disabled={!isEditing}
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Github className="w-4 h-4 inline mr-2" />
                    GitHub
                  </label>
                  <input
                    type="text"
                    value={formData.github || ""}
                    onChange={(e) => handleInputChange("github", e.target.value)}
                    disabled={!isEditing}
                    placeholder="username"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-2" />
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={formData.linkedin || ""}
                    onChange={(e) => handleInputChange("linkedin", e.target.value)}
                    disabled={!isEditing}
                    placeholder="username"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer les modifications"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {updateMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ Profil mis à jour avec succès
        </div>
      )}
    </div>
  );
}
