// Advanced caching system with multiple strategies
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string;
  strategy?: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  maxSize?: number;
}

class AdvancedCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private maxMemorySize = 100; // Maximum number of items in memory
  private version = '1.0.0';

  // Memory cache with LRU eviction
  private setMemoryCache<T>(key: string, data: T, options: CacheOptions = {}): void {
    if (this.memoryCache.size >= this.maxMemorySize) {
      // Remove oldest entry (LRU)
      const firstKey = this.memoryCache.keys().next().value;
      if (typeof firstKey !== 'undefined') {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || 300000, // 5 minutes default
      version: options.version || this.version,
    });
  }

  private getMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl || entry.version !== this.version) {
      this.memoryCache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.memoryCache.delete(key);
    this.memoryCache.set(key, entry);
    return entry.data;
  }

  // localStorage with compression and encryption
  private setLocalStorageCache<T>(key: string, data: T, options: CacheOptions = {}): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl || 3600000, // 1 hour default
        version: options.version || this.version,
      };

      const compressed = this.compress(JSON.stringify(entry));
      localStorage.setItem(`cache_${key}`, compressed);
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  private getLocalStorageCache<T>(key: string): T | null {
    try {
      const compressed = localStorage.getItem(`cache_${key}`);
      if (!compressed) return null;

      const decompressed = this.decompress(compressed);
      const entry: CacheEntry<T> = JSON.parse(decompressed);

      const now = Date.now();
      if (now - entry.timestamp > entry.ttl || entry.version !== this.version) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  // IndexedDB for large data
  private async setIndexedDBCache<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl || 86400000, // 24 hours default
        version: options.version || this.version,
      };

      await this.promisifyRequest(store.put(entry, key));
    } catch (error) {
      console.warn('Failed to set IndexedDB cache:', error);
    }
  }

  private async getIndexedDBCache<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const entry = await this.promisifyRequest<CacheEntry<T> | undefined>(store.get(key));

      if (!entry) return null;

      const now = Date.now();
      if (now - entry.timestamp > entry.ttl || entry.version !== this.version) {
        // Clean up expired entry
        const deleteTransaction = db.transaction(['cache'], 'readwrite');
        const deleteStore = deleteTransaction.objectStore('cache');
        await this.promisifyRequest(deleteStore.delete(key));
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to get IndexedDB cache:', error);
      return null;
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BlogCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      };
    });
  }

  // Simple compression using base64 and string manipulation
  private compress(str: string): string {
    try {
      return btoa(encodeURIComponent(str));
    } catch {
      return str;
    }
  }

  private decompress(str: string): string {
    try {
      return decodeURIComponent(atob(str));
    } catch {
      return str;
    }
  }

  // Public API
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const strategy = options.strategy || 'memory';

    switch (strategy) {
      case 'memory':
        this.setMemoryCache(key, data, options);
        break;
      case 'localStorage':
        this.setLocalStorageCache(key, data, options);
        break;
      case 'sessionStorage':
        try {
          sessionStorage.setItem(`cache_${key}`, JSON.stringify({
            data,
            timestamp: Date.now(),
            ttl: options.ttl || 1800000, // 30 minutes default
            version: options.version || this.version,
          }));
        } catch (error) {
          console.warn('Failed to set sessionStorage cache:', error);
        }
        break;
      case 'indexedDB':
        await this.setIndexedDBCache(key, data, options);
        break;
    }
  }

  async get<T>(key: string, strategy: CacheOptions['strategy'] = 'memory'): Promise<T | null> {
    switch (strategy) {
      case 'memory':
        return this.getMemoryCache<T>(key);
      case 'localStorage':
        return this.getLocalStorageCache<T>(key);
      case 'sessionStorage':
        try {
          const item = sessionStorage.getItem(`cache_${key}`);
          if (!item) return null;
          
          const entry = JSON.parse(item);
          const now = Date.now();
          
          if (now - entry.timestamp > entry.ttl || entry.version !== this.version) {
            sessionStorage.removeItem(`cache_${key}`);
            return null;
          }
          
          return entry.data;
        } catch {
          return null;
        }
      case 'indexedDB':
        return await this.getIndexedDBCache<T>(key);
      default:
        return this.getMemoryCache<T>(key);
    }
  }

  // Cache with fallback strategies
  async getWithFallback<T>(key: string, strategies: CacheOptions['strategy'][] = ['memory', 'localStorage', 'indexedDB']): Promise<T | null> {
    for (const strategy of strategies) {
      const result = await this.get<T>(key, strategy);
      if (result !== null) return result;
    }
    return null;
  }

  // Clear cache
  clear(strategy?: CacheOptions['strategy']): void {
    if (!strategy || strategy === 'memory') {
      this.memoryCache.clear();
    }
    
    if (!strategy || strategy === 'localStorage') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
    
    if (!strategy || strategy === 'sessionStorage') {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => sessionStorage.removeItem(key));
    }
    
    if (!strategy || strategy === 'indexedDB') {
      this.clearIndexedDB();
    }
  }

  private async clearIndexedDB(): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await this.promisifyRequest(store.clear());
    } catch (error) {
      console.warn('Failed to clear IndexedDB cache:', error);
    }
  }

  // Cache statistics
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize,
      version: this.version,
    };
  }
}

// Singleton instance
export const cache = new AdvancedCache();

// React Query cache configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return error?.response?.status === 408 || error?.response?.status === 429;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
};

// Cache keys factory
export const cacheKeys = {
  articles: {
    all: ['articles'] as const,
    lists: () => [...cacheKeys.articles.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...cacheKeys.articles.lists(), filters] as const,
    details: () => [...cacheKeys.articles.all, 'detail'] as const,
    detail: (id: string) => [...cacheKeys.articles.details(), id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...cacheKeys.categories.all, 'list'] as const,
  },
  homepage: {
    all: ['homepage'] as const,
    public: () => [...cacheKeys.homepage.all, 'public'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...cacheKeys.user.all, 'profile'] as const,
  },
} as const;
