'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailTemplate, updateEmailTemplate, type UpdateEmailTemplateDto } from '../../../../services/email-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

const EMAIL_TYPE_LABELS: Record<string, string> = {
  'new_article': 'Nouvel article',
  'author_published': 'Publication auteur',
  'category_update': 'Mise à jour catégorie',
  'welcome': 'Bienvenue',
  'password_reset': 'Réinitialisation mot de passe',
};

export default function EditEmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const templateId = params.id as string;

  const [formData, setFormData] = useState<UpdateEmailTemplateDto>({});
  const [newVariable, setNewVariable] = useState('');
  const [isFormReady, setIsFormReady] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['email-template', templateId],
    queryFn: () => getEmailTemplate(templateId),
    enabled: !!templateId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEmailTemplateDto) => updateEmailTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      queryClient.invalidateQueries({ queryKey: ['email-template', templateId] });
      console.log('Template mis à jour avec succès');
      router.push('/dashboard/email-templates');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
    },
  });

  // Initialize form data when template is loaded
  useEffect(() => {
    if (template && !isFormReady) {
      setFormData({
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        description: template.description,
        availableVariables: [...template.availableVariables],
        isActive: template.isActive,
      });
      setIsFormReady(true);
    }
  }, [template, isFormReady]);

  const handleInputChange = (field: keyof UpdateEmailTemplateDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addVariable = () => {
    if (newVariable && formData.availableVariables && !formData.availableVariables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        availableVariables: [...(prev.availableVariables || []), newVariable],
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      availableVariables: prev.availableVariables?.filter(v => v !== variable) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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

  if (!isFormReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Préparation du formulaire...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/email-templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Modifier le template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {template.name} - {EMAIL_TYPE_LABELS[template.type] || template.type}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
              <CardDescription>
                Modifiez les informations principales du template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type de template</Label>
                <Badge variant="secondary" className="w-fit">
                  {EMAIL_TYPE_LABELS[template.type] || template.type}
                </Badge>
                <p className="text-sm text-gray-500">
                  Le type ne peut pas être modifié après création
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du template *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ex: Notification nouvel article"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet de l'email *</Label>
                <Input
                  id="subject"
                  value={formData.subject || ''}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="ex: {{siteName}}: {{articleTitle}}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez l'usage de ce template..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Template actif</Label>
              </div>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Variables disponibles</CardTitle>
              <CardDescription>
                Variables qui peuvent être utilisées dans le template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  placeholder="{{nouvelleVariable}}"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariable}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.availableVariables?.map((variable, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{variable}</span>
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenu du template</CardTitle>
            <CardDescription>
              Modifiez le contenu HTML et texte du template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenu HTML *</Label>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent || ''}
                onChange={(e) => handleInputChange('htmlContent', e.target.value)}
                placeholder="<h1>Bonjour {{userName}}</h1>..."
                rows={10}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textContent">Contenu texte</Label>
              <Textarea
                id="textContent"
                value={formData.textContent || ''}
                onChange={(e) => handleInputChange('textContent', e.target.value)}
                placeholder="Version texte de l'email..."
                rows={6}
              />
              <p className="text-sm text-gray-500">
                Version texte pour les clients email qui ne supportent pas le HTML
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Link href={`/dashboard/email-templates/${templateId}/preview`}>
            <Button variant="outline" type="button">
              Aperçu
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Link href="/dashboard/email-templates">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !formData.name}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
