'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getEmailTemplate, previewEmailTemplate } from '../../../../services/email-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const DEFAULT_PREVIEW_VARIABLES: Record<string, Record<string, string>> = {
  'new_article': {
    '{{siteName}}': 'Mon Blog',
    '{{articleTitle}}': 'Guide complet du développement React',
    '{{articleUrl}}': 'https://monblog.com/articles/guide-react',
    '{{articleExcerpt}}': 'Découvrez les meilleures pratiques pour développer avec React...',
    '{{authorName}}': 'Jean Dupont',
    '{{userName}}': 'Marie Martin',
    '{{unsubscribeUrl}}': 'https://monblog.com/unsubscribe?token=abc123',
  },
  'author_published': {
    '{{siteName}}': 'Mon Blog',
    '{{articleTitle}}': 'Les nouveautés JavaScript 2024',
    '{{articleUrl}}': 'https://monblog.com/articles/js-2024',
    '{{articleExcerpt}}': 'Explorez les dernières fonctionnalités de JavaScript...',
    '{{authorName}}': 'Sophie Durand',
    '{{userName}}': 'Pierre Lefebvre',
    '{{unsubscribeUrl}}': 'https://monblog.com/unsubscribe?token=def456',
  },
  'category_update': {
    '{{siteName}}': 'Mon Blog',
    '{{articleTitle}}': 'Introduction à TypeScript',
    '{{articleUrl}}': 'https://monblog.com/articles/intro-typescript',
    '{{articleExcerpt}}': 'Apprenez TypeScript étape par étape...',
    '{{categoryName}}': 'Développement Web',
    '{{userName}}': 'Alex Moreau',
    '{{unsubscribeUrl}}': 'https://monblog.com/unsubscribe?token=ghi789',
  },
  'welcome': {
    '{{siteName}}': 'Mon Blog',
    '{{userName}}': 'Nouveau Membre',
    '{{userEmail}}': 'nouveau@example.com',
  },
  'password_reset': {
    '{{siteName}}': 'Mon Blog',
    '{{userName}}': 'Utilisateur',
    '{{resetUrl}}': 'https://monblog.com/reset-password?token=reset123',
    '{{expiresIn}}': '24 heures',
  },
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
  'new_article': 'Nouvel article',
  'author_published': 'Publication auteur',
  'category_update': 'Mise à jour catégorie',
  'welcome': 'Bienvenue',
  'password_reset': 'Réinitialisation mot de passe',
};

export default function PreviewEmailTemplatePage() {
  const params = useParams();
  const templateId = params.id as string;

  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [isVariablesReady, setIsVariablesReady] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['email-template', templateId],
    queryFn: () => getEmailTemplate(templateId),
    enabled: !!templateId,
  });

  const previewMutation = useMutation({
    mutationFn: (variables: Record<string, string>) => previewEmailTemplate(templateId, variables),
  });

  // Initialize preview variables when template is loaded
  React.useEffect(() => {
    if (template && !isVariablesReady) {
      const defaultVars = DEFAULT_PREVIEW_VARIABLES[template.type] || {};
      const initialVars: Record<string, string> = {};
      
      template.availableVariables.forEach(variable => {
        initialVars[variable] = defaultVars[variable] || `Exemple pour ${variable}`;
      });
      
      setPreviewVariables(initialVars);
      setIsVariablesReady(true);
    }
  }, [template, isVariablesReady]);

  // Auto-preview when variables are ready
  React.useEffect(() => {
    if (isVariablesReady && Object.keys(previewVariables).length > 0) {
      previewMutation.mutate(previewVariables);
    }
  }, [isVariablesReady, previewVariables]);

  const handleVariableChange = (variable: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleRefreshPreview = () => {
    previewMutation.mutate(previewVariables);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement du template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Template introuvable
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Le template que vous cherchez n'existe pas ou a été supprimé
          </p>
          <Link href="/dashboard/email-templates">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/email-templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Eye className="mr-2 h-6 w-6" />
              Aperçu du template
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {template.name} - {EMAIL_TYPE_LABELS[template.type] || template.type}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={template.isActive ? "default" : "destructive"}
          >
            {template.isActive ? 'Actif' : 'Inactif'}
          </Badge>
          <Link href={`/dashboard/email-templates/${templateId}/edit`}>
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Variables Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Variables du template</CardTitle>
              <CardDescription>
                Personnalisez les valeurs pour la prévisualisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.availableVariables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable} className="text-sm font-medium">
                    {variable}
                  </Label>
                  <Input
                    id={variable}
                    value={previewVariables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    placeholder={`Valeur pour ${variable}`}
                    className="text-sm"
                  />
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleRefreshPreview}
                  disabled={previewMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {previewMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Actualiser l'aperçu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu de l'email</CardTitle>
              <CardDescription>
                Prévisualisation du rendu final de l'email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMutation.isPending ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Génération de l'aperçu...</span>
                  </div>
                </div>
              ) : previewMutation.error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Erreur de prévisualisation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Impossible de générer l'aperçu du template
                  </p>
                </div>
              ) : previewMutation.data ? (
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="html">Aperçu HTML</TabsTrigger>
                    <TabsTrigger value="text">Version texte</TabsTrigger>
                    <TabsTrigger value="subject">Sujet</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html" className="mt-4">
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: previewMutation.data.html 
                        }}
                        className="prose prose-sm max-w-none dark:prose-invert"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4">
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {previewMutation.data.text || 'Aucun contenu texte défini'}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="subject" className="mt-4">
                    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Sujet:
                        </span>
                        <span className="text-sm font-semibold">
                          {previewMutation.data.subject}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Cliquez sur "Actualiser l'aperçu" pour voir le rendu
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
