'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followAuthor, unfollowAuthor, checkFollowingAuthor, subscribeToCategory, unsubscribeFromCategory, checkCategorySubscription } from '../services/subscriptions';
import { toast } from 'sonner';

export function useSubscription(type: 'author' | 'category', targetId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['subscription', type, targetId];

  const { data: isSubscribed, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (type === 'author') {
        return await checkFollowingAuthor(targetId);
      } else {
        return await checkCategorySubscription(targetId);
      }
    },
    staleTime: 30000, // 30 seconds
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (type === 'author') {
        return await followAuthor(targetId);
      } else {
        return await subscribeToCategory(targetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(type === 'author' ? 'Vous suivez maintenant cet auteur' : 'Abonné à la catégorie');
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'abonnement");
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (type === 'author') {
        return await unfollowAuthor(targetId);
      } else {
        return await unsubscribeFromCategory(targetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Désabonné avec succès');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors du désabonnement');
    },
  });

  const toggle = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  return {
    isSubscribed: isSubscribed || false,
    isLoading,
    toggle,
    isToggling: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
}
