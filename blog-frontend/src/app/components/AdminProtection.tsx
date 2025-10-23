'use client';

import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface AdminProtectionProps {
  children: React.ReactNode;
  requirePrimaryAdmin?: boolean;
}

/**
 * Protection component for admin-only pages
 * - requirePrimaryAdmin=true: Only PRIMARY_ADMIN can access
 * - requirePrimaryAdmin=false: Both PRIMARY_ADMIN and SECONDARY_ADMIN can access
 */
export function AdminProtection({ children, requirePrimaryAdmin = false }: AdminProtectionProps) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is PRIMARY_ADMIN when required
    if (requirePrimaryAdmin && (user.role ?? '') !== 'PRIMARY_ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Check if user is at least an admin
    if (!requirePrimaryAdmin && !['PRIMARY_ADMIN', 'SECONDARY_ADMIN'].includes(user.role ?? '')) {
      router.push('/');
      return;
    }
  }, [user, ready, router, requirePrimaryAdmin]);

  // Show loading state
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

  // Redirect if not authorized
  if (requirePrimaryAdmin && (user.role ?? '') !== 'PRIMARY_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirection...</p>
        </div>
      </div>
    );
  }

  if (!requirePrimaryAdmin && !['PRIMARY_ADMIN', 'SECONDARY_ADMIN'].includes(user.role ?? '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

