'use client';

import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

interface PrimaryAdminProtectionProps {
  children: React.ReactNode;
}

/**
 * Protection component for PRIMARY_ADMIN only pages
 * Redirects SECONDARY_ADMIN to /dashboard
 * Redirects non-admins to /
 */
export function PrimaryAdminProtection({ children }: PrimaryAdminProtectionProps) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Redirect SECONDARY_ADMIN to dashboard
    if (user.role === 'SECONDARY_ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Redirect non-admins to home
    if (user.role !== 'PRIMARY_ADMIN') {
      router.push('/');
      return;
    }
  }, [user, ready, router]);

  // Show loading state while checking authentication
  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if SECONDARY_ADMIN or lower
  if (user.role !== 'PRIMARY_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Accès Refusé</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Cette page est réservée à l'administrateur principal.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
