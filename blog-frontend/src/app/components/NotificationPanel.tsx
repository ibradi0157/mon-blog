'use client';
import { useNotifications } from '../providers/NotificationProvider';
import { X, Check, CheckCheck, Trash2, Bell, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface NotificationPanelProps {
  onClose: () => void;
}

const notificationIcons = {
  article_published: '📝',
  comment_added: '💬',
  comment_reply: '↩️',
  like_received: '👍',
  follow: '👤',
  mention: '@',
};

const notificationColors = {
  article_published: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  comment_added: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  comment_reply: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  like_received: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
  follow: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  mention: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();

  return (
    <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Aucune notification
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Vous serez notifié des nouvelles activités
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${
                    notificationColors[notification.type]
                  }`}>
                    {notificationIcons[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </span>

                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={onClose}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Voir
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => {
              refreshNotifications();
              onClose();
            }}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}
