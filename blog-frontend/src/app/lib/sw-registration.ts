// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async register(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification();
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', this.handleMessage);

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls,
      });
    }
  }

  async clearCache(): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
  }

  private handleMessage = (event: MessageEvent) => {
    const { data } = event;
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.url);
        break;
      case 'OFFLINE_READY':
        this.showOfflineReadyNotification();
        break;
      default:
        break;
    }
  };

  private showUpdateNotification(): void {
    // Show user notification about available update
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mise à jour disponible', {
        body: 'Une nouvelle version du blog est disponible. Actualisez la page pour la charger.',
        icon: '/icon-192x192.png',
      });
    } else {
      // Fallback to custom notification
      this.showCustomNotification('Mise à jour disponible', 'Actualisez la page pour charger la nouvelle version.');
    }
  }

  private showOfflineReadyNotification(): void {
    this.showCustomNotification('Mode hors ligne activé', 'Le blog est maintenant disponible hors ligne.');
  }

  private showCustomNotification(title: string, message: string): void {
    // Custom notification implementation
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-semibold">${title}</h4>
          <p class="text-sm mt-1">${message}</p>
        </div>
        <button class="ml-2 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Preload critical resources
  async preloadCriticalResources(): Promise<void> {
    const criticalUrls = [
      '/',
      '/articles',
      '/api/v1/articles/public?page=1&limit=10',
      '/api/v1/categories',
      '/api/v1/homepage/public',
    ];

    await this.cacheUrls(criticalUrls);
  }
}

// Hook for React components
export function useServiceWorker() {
  const swManager = ServiceWorkerManager.getInstance();
  
  return {
    register: () => swManager.register(),
    unregister: () => swManager.unregister(),
    update: () => swManager.update(),
    skipWaiting: () => swManager.skipWaiting(),
    clearCache: () => swManager.clearCache(),
    preloadCriticalResources: () => swManager.preloadCriticalResources(),
    isOnline: () => swManager.isOnline(),
    requestNotificationPermission: () => swManager.requestNotificationPermission(),
  };
}
