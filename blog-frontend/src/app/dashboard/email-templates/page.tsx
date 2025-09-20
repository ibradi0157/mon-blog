'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailTemplates, deleteEmailTemplate, type EmailTemplate } from '../../services/email-templates';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['email-templates'],
    queryFn: getEmailTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      console.log('Template supprimé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le template "${name}" ?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'new_article': 'Nouvel article',
      'author_published': 'Publication auteur', 
      'category_update': 'Mise à jour catégorie',
      'welcome': 'Bienvenue',
      'password_reset': 'Réinitialisation mot de passe',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'new_article': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'author_published': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'category_update': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'welcome': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'password_reset': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Impossible de charger les templates d'emails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Mail className="mr-2 h-6 w-6" />
            Templates d'emails
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les templates d'emails automatiques envoyés aux utilisateurs
          </p>
        </div>
        <Link href="/dashboard/email-templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau template
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template: EmailTemplate) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge 
                    variant="secondary" 
                    className={getTypeColor(template.type)}
                  >
                    {getTypeLabel(template.type)}
                  </Badge>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge 
                    variant={template.isActive ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {template.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Sujet:</strong> {template.subject}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Variables disponibles:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.availableVariables.slice(0, 3).map((variable, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {variable}
                      </Badge>
                    ))}
                    {template.availableVariables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.availableVariables.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/email-templates/${template.id}/preview`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Aperçu
                      </Button>
                    </Link>
                    <Link href={`/dashboard/email-templates/${template.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates && templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Aucun template trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Commencez par créer votre premier template d'email
          </p>
          <Link href="/dashboard/email-templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un template
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
