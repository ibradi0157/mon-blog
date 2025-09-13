'use client';

import { useEffect, useState, useCallback } from 'react';

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const register = useCallback(async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          type: 'module',
        });

        setRegistration(registration);
        return true;
      } catch (err) {
        console.error('Service worker registration failed:', err);
        setError(err as Error);
        return false;
      }
    }
    return false;
  }, []);

  const unregister = useCallback(async () => {
    if (registration) {
      try {
        await registration.unregister();
        setRegistration(null);
        return true;
      } catch (err) {
        console.error('Service worker unregistration failed:', err);
        return false;
      }
    }
    return false;
  }, [registration]);

  const preloadCriticalResources = useCallback(() => {
    // Add any critical resources you want to preload
    const criticalResources = [
      '/',
      '/_next/static/css/styles.css',
      '/_next/static/chunks/main.js',
      // Add other critical resources here
    ];

    if ('caches' in window) {
      caches.open('critical-resources').then((cache) => {
        return cache.addAll(criticalResources);
      });
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      register();
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        unregister();
      }
    };
  }, [register, unregister]);

  return {
    registration,
    error,
    register,
    unregister,
    preloadCriticalResources,
  };
}
