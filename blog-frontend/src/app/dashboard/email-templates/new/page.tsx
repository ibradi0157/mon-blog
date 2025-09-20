'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmailTemplate, type CreateEmailTemplateDto } from '../../../services/email-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EMAIL_TYPES = [
  { value: 'new_article', label: 'Nouvel article' },
  { value: 'author_published', label: 'Publication auteur' },
  { value: 'category_update', label: 'Mise à jour catégorie' },
  { value: 'welcome', label: 'Bienvenue' },
  { value: 'password_reset', label: 'Réinitialisation mot de passe' },
];

const DEFAULT_VARIABLES: Record<string, string[]> = {
  'new_article': ['{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}', '{{authorName}}', '{{userName}}', '{{unsubscribeUrl}}'],
  'author_published': ['{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}', '{{authorName}}', '{{userName}}', '{{unsubscribeUrl}}'],
  'category_update': ['{{siteName}}', '{{articleTitle}}', '{{articleUrl}}', '{{articleExcerpt}}', '{{categoryName}}', '{{userName}}', '{{unsubscribeUrl}}'],
  'welcome': ['{{siteName}}', '{{userName}}', '{{userEmail}}'],
  'password_reset': ['{{siteName}}', '{{userName}}', '{{resetUrl}}', '{{expiresIn}}'],
};

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateEmailTemplateDto>({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    description: '',
    availableVariables: [],
    isActive: true,
  });

  const [newVariable, setNewVariable] = useState('');

  const createMutation = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      console.log('Template créé avec succès');
      router.push('/dashboard/email-templates');
    },
    onError: (error) => {
      console.error('Erreur lors de la création:', error);
    },
  });

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      availableVariables: DEFAULT_VARIABLES[type] || [],
    }));
  };

  const handleInputChange = (field: keyof CreateEmailTemplateDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addVariable = () => {
    if (newVariable && !formData.availableVariables.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        availableVariables: [...prev.availableVariables, newVariable],
      }));
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      availableVariables: prev.availableVariables.filter(v => v !== variable),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

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
            Nouveau template d'email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Créez un nouveau template pour les emails automatiques
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
                Définissez les informations principales du template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de template *</Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                  placeholder="Sélectionnez un type"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMAIL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ex: Notification nouvel article"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet de l'email *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="ex: {{siteName}}: {{articleTitle}}"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez l'usage de ce template..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
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
                {formData.availableVariables.map((variable, index) => (
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

              {formData.availableVariables.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Sélectionnez un type de template pour voir les variables par défaut
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenu du template</CardTitle>
            <CardDescription>
              Définissez le contenu HTML et texte du template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="htmlContent">Contenu HTML *</Label>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
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
                value={formData.textContent}
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
        <div className="flex justify-end space-x-2">
          <Link href="/dashboard/email-templates">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || !formData.name || !formData.type}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer le template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
