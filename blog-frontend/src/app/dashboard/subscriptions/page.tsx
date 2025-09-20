'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription,
  type Subscription,
  type CreateSubscriptionDto,
  type UpdateSubscriptionDto
} from '../../services/subscriptions';
// import { getCategories } from '../../services/categories';
// import { getAuthors } from '../../services/articles';
// import { toast } from 'react-hot-toast';
import { 
  Bell, 
  BellOff, 
  Plus, 
  Settings, 
  Clock, 
  User, 
  Folder,
  Globe,
  Trash2,
  Mail
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  displayName: string;
  username: string;
}

export default function SubscriptionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'category' | 'author' | 'all_articles'>('category');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedFrequency, setSelectedFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getUserSubscriptions,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Placeholder for categories - implement API call later
      return [];
    },
  });

  const { data: authors = [] } = useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      // Placeholder for authors - implement API call later
      return [];
    },
  });

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      console.log('Abonnement créé avec succès !'); // TODO: Replace with toast
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la création de l\'abonnement:', error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionDto }) => 
      updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      console.log('Abonnement modifié avec succès !'); // TODO: Replace with toast
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la modification:', error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      console.log('Abonnement supprimé avec succès !'); // TODO: Replace with toast
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la suppression:', error.message);
    },
  });

  const resetForm = () => {
    setSelectedType('category');
    setSelectedTarget('');
    setSelectedFrequency('instant');
  };

  const handleCreateSubscription = () => {
    const subscriptionData: CreateSubscriptionDto = {
      type: selectedType,
      frequency: selectedFrequency,
    };

    if (selectedType !== 'all_articles' && selectedTarget) {
      subscriptionData.targetId = selectedTarget;
    }

    createMutation.mutate(subscriptionData);
  };

  const handleUpdateFrequency = (subscriptionId: string, frequency: 'instant' | 'daily' | 'weekly') => {
    updateMutation.mutate({
      id: subscriptionId,
      data: { frequency }
    });
  };

  const handleToggleActive = (subscriptionId: string, isActive: boolean) => {
    updateMutation.mutate({
      id: subscriptionId,
      data: { isActive: !isActive }
    });
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      deleteMutation.mutate(subscriptionId);
    }
  };

  const getSubscriptionIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <Folder className="w-5 h-5 text-purple-600" />;
      case 'author':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'all_articles':
        return <Globe className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      instant: 'bg-red-100 text-red-800',
      daily: 'bg-yellow-100 text-yellow-800',
      weekly: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      instant: 'Instantané',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[frequency as keyof typeof colors]}`}>
        {labels[frequency as keyof typeof labels]}
      </span>
    );
  };

  const getTargetName = (subscription: Subscription) => {
    if (subscription.type === 'all_articles') {
      return 'Tous les articles';
    }
    if (subscription.type === 'category' && subscription.category) {
      return subscription.category.name;
    }
    if (subscription.type === 'author' && subscription.targetId) {
      const author = authors.find((a: Author) => a.id === subscription.targetId);
      return author ? author.displayName : 'Auteur inconnu';
    }
    return 'Cible inconnue';
  };

  if (subscriptionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-6 h-6 text-blue-600" />
                Mes Abonnements
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez vos notifications par email pour les nouveaux articles
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel Abonnement
            </button>
          </div>
        </div>

        {/* Create Subscription Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Créer un abonnement</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'abonnement
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value as 'category' | 'author' | 'all_articles');
                    setSelectedTarget('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="category">Catégorie</option>
                  <option value="author">Auteur</option>
                  <option value="all_articles">Tous les articles</option>
                </select>
              </div>

              {selectedType !== 'all_articles' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedType === 'category' ? 'Catégorie' : 'Auteur'}
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    {selectedType === 'category' && (categories as Category[]).map((category: Category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                    {selectedType === 'author' && authors.map((author: Author) => (
                      <option key={author.id} value={author.id}>
                        {author.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence
                </label>
                <select
                  value={selectedFrequency}
                  onChange={(e) => setSelectedFrequency(e.target.value as 'instant' | 'daily' | 'weekly')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="instant">Instantané</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateSubscription}
                disabled={createMutation.isPending || (selectedType !== 'all_articles' && !selectedTarget)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? 'Création...' : 'Créer l\'abonnement'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun abonnement
              </h3>
              <p className="text-gray-600 mb-6">
                Créez votre premier abonnement pour recevoir des notifications par email
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer un abonnement
              </button>
            </div>
          ) : (
            subscriptions.map((subscription: Subscription) => (
              <div key={subscription.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getSubscriptionIcon(subscription.type)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getTargetName(subscription)}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        Abonnement {subscription.type === 'all_articles' ? 'général' : `par ${subscription.type === 'category' ? 'catégorie' : 'auteur'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getFrequencyBadge(subscription.frequency)}
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={subscription.frequency}
                        onChange={(e) => handleUpdateFrequency(subscription.id, e.target.value as 'instant' | 'daily' | 'weekly')}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="instant">Instantané</option>
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                      </select>

                      <button
                        onClick={() => handleToggleActive(subscription.id, subscription.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          subscription.isActive 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={subscription.isActive ? 'Actif' : 'Inactif'}
                      >
                        {subscription.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
