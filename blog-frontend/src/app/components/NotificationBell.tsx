'use client';
import { Bell } from 'lucide-react';
import { useNotifications } from '../providers/NotificationProvider';
import { useState, useRef, useEffect } from 'react';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { unreadCount, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className={`w-6 h-6 transition-colors ${
          isConnected 
            ? 'text-slate-700 dark:text-slate-300' 
            : 'text-slate-400 dark:text-slate-600'
        }`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" 
                title="Reconnexion en cours..." />
        )}
      </button>

      {isOpen && (
        <div ref={panelRef}>
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
