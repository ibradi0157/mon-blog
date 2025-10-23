'use client';
import { Bell, Tag } from 'lucide-react';
import { FollowButton } from './FollowButton';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../providers/AuthProvider';

interface ArticleSubscriptionWidgetProps {
  authorId: string;
  authorName: string;
  categoryId?: string;
  categoryName?: string;
}

export function ArticleSubscriptionWidget({
  authorId,
  authorName,
  categoryId,
  categoryName,
}: ArticleSubscriptionWidgetProps) {
  const { user } = useAuth();
  const categorySubscription = categoryId ? useSubscription('category', categoryId) : null;

  // Don't show if user is the author
  if (user?.id === authorId) {
    return null;
  }

  return (
    <div className="mt-12 p-6 md:p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bell className="w-8 h-8 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Restez informé
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Suivez <span className="font-semibold text-blue-600 dark:text-blue-400">{authorName}</span> pour ne manquer aucun de ses articles
              {categoryName && (
                <> ou abonnez-vous à la catégorie <span className="font-semibold text-purple-600 dark:text-purple-400">{categoryName}</span></>
              )}.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <FollowButton authorId={authorId} authorName={authorName} showCount />
            
            {categoryId && categorySubscription && (
              <button
                onClick={categorySubscription.toggle}
                disabled={categorySubscription.isToggling}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  categorySubscription.isSubscribed
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                } disabled:opacity-50`}
              >
                <Tag className="w-5 h-5" />
                <span>
                  {categorySubscription.isSubscribed 
                    ? `✓ Abonné à ${categoryName}` 
                    : `S'abonner à ${categoryName}`
                  }
                </span>
              </button>
            )}
          </div>

          {/* Info */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recevez des notifications instantanées quand de nouveaux articles sont publiés
          </p>
        </div>
      </div>
    </div>
  );
}
