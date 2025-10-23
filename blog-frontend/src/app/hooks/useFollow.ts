import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser, getFollowStatus } from '../services/follow';
import { toast } from 'sonner';

export function useFollow(userId: string) {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => getFollowStatus(userId),
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      toast.success(data.message || 'Vous suivez maintenant cet auteur');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du suivi');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      toast.success(data.message || 'Vous ne suivez plus cet auteur');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du désabonnement');
    },
  });

  const toggle = () => {
    if (status?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing: status?.isFollowing || false,
    followersCount: status?.followersCount || 0,
    followingCount: status?.followingCount || 0,
    toggle,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
    isLoading,
  };
}
