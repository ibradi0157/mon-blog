'use client';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { useFollow } from '../hooks/useFollow';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  authorId: string;
  authorName?: string;
  variant?: 'default' | 'compact' | 'icon';
  showCount?: boolean;
}

export function FollowButton({ authorId, authorName, variant = 'default', showCount = false }: FollowButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { isFollowing, followersCount, toggle, isToggling, isLoading } = useFollow(authorId);

  // Don't show button if not logged in or if it's the user's own profile
  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
      >
        <UserPlus className="w-5 h-5" />
        <span>Suivre</span>
      </button>
    );
  }

  if (user.id === authorId) return null;

  if (variant === 'icon') {
    return (
      <button
        onClick={toggle}
        disabled={isToggling || isLoading}
        className={`p-2 rounded-full transition-all ${
          isFollowing
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
        title={isFollowing ? 'Ne plus suivre' : 'Suivre'}
      >
        {isFollowing ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={isToggling || isLoading}
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{isFollowing ? 'Abonné' : 'Suivre'}</span>
        </button>
        {showCount && followersCount !== undefined && (
          <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4" />
            <span>{followersCount}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={isToggling || isLoading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isFollowing
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
        } disabled:opacity-50`}
      >
        {isFollowing ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
        <span>
          {isFollowing 
            ? `Abonné${authorName ? ` à ${authorName}` : ''}` 
            : `Suivre${authorName ? ` ${authorName}` : ''}`
          }
        </span>
      </button>
      {showCount && followersCount !== undefined && (
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {followersCount} {followersCount > 1 ? 'abonnés' : 'abonné'}
          </span>
        </div>
      )}
    </div>
  );
}
