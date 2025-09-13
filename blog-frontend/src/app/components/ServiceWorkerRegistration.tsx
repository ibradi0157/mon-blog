"use client";
import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let mounted = true;
    let controllerChangeHandler: (() => void) | null = null;

    const registerSW = async () => {
      try {
        // Register (do not unregister in production to allow seamless updates)
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (!mounted) return;
        setReg(registration);

        // Detect new updates
        const listenForUpdate = (r: ServiceWorkerRegistration) => {
          r.addEventListener('updatefound', () => {
            const newWorker = r.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // A new version is installed and waiting
                setUpdateAvailable(true);
              }
            });
          });
        };

        listenForUpdate(registration);

        // Also check on load if there's already a waiting worker
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        // Handle controller change (after skipWaiting) to reload once
        controllerChangeHandler = () => {
          window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

        console.log('✅ Service Worker registered');
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        setError(err as Error);
      }
    };

    registerSW();

    return () => {
      mounted = false;
      if (controllerChangeHandler) {
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
      }
      // In dev, unregister on unmount to avoid caching headaches
      if (process.env.NODE_ENV === 'development' && reg) {
        reg.unregister();
      }
    };
  }, []);

  const refreshNow = () => {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: force update check
      reg?.update().finally(() => window.location.reload());
    }
  };

  const dismiss = () => setUpdateAvailable(false);

  return (
    <>
      {updateAvailable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92vw] sm:w-auto">
          <div className="rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-2 animate-[fadeIn_200ms_ease-out]">
            <div className="text-sm flex-1">
              <span className="font-medium">Mise à jour disponible</span>
              <span className="opacity-80"> — Une nouvelle version est prête. Actualisez pour l’appliquer.</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={dismiss} className="px-3 py-1.5 rounded border text-sm hover:bg-slate-100 dark:hover:bg-slate-800">Plus tard</button>
              <button onClick={refreshNow} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500">Actualiser</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
