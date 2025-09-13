import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
  namespace?: string;
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Cache with automatic key generation and tagging
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    try {
      return await this.cacheManager.get<T>(fullKey);
    } catch (error) {
      console.warn(`Cache get error for key ${fullKey}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 300, namespace } = options; // 5 minutes default
    const fullKey = namespace ? `${namespace}:${key}` : key;
    
    try {
      await this.cacheManager.set(fullKey, value, ttl * 1000);
      
      // Store tags for cache invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          await this.addToTag(tag, fullKey);
        }
      }
    } catch (error) {
      console.warn(`Cache set error for key ${fullKey}:`, error);
    }
  }

  async del(key: string, namespace?: string): Promise<void> {
    const fullKey = namespace ? `${namespace}:${key}` : key;
    try {
      await this.cacheManager.del(fullKey);
    } catch (error) {
      console.warn(`Cache delete error for key ${fullKey}:`, error);
    }
  }

  // Cache with function execution
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options.namespace);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  // Tag-based cache invalidation
  private async addToTag(tag: string, key: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    try {
      const keys = await this.get<string[]>(tagKey) || [];
      if (!keys.includes(key)) {
        keys.push(key);
        await this.set(tagKey, keys, { ttl: 3600 }); // 1 hour
      }
    } catch (error) {
      console.warn(`Error adding key to tag ${tag}:`, error);
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    try {
      const keys = await this.get<string[]>(tagKey);
      if (keys) {
        await Promise.all(keys.map(key => this.cacheManager.del(key)));
        await this.del(tagKey);
      }
    } catch (error) {
      console.warn(`Error invalidating tag ${tag}:`, error);
    }
  }

  // Bulk operations
  async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => namespace ? `${namespace}:${key}` : key);
    try {
      return await Promise.all(fullKeys.map(key => this.cacheManager.get<T>(key)));
    } catch (error) {
      console.warn('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      await Promise.all(
        entries.map(({ key, value }) => this.set(key, value, options))
      );
    } catch (error) {
      console.warn('Cache mset error:', error);
    }
  }

  // Cache statistics
  async getStats(): Promise<{
    hits: number;
    misses: number;
    keys: number;
  }> {
    try {
      // This would need to be implemented based on your Redis setup
      // For now, return mock data
      return {
        hits: 0,
        misses: 0,
        keys: 0,
      };
    } catch (error) {
      return { hits: 0, misses: 0, keys: 0 };
    }
  }

  // Clear all cache
  async reset(): Promise<void> {
    try {
      // Use store.reset() if available, otherwise clear manually
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else {
        // Fallback: clear known keys (implementation depends on cache store)
        console.warn('Cache reset not supported by current store');
      }
    } catch (error) {
      console.warn('Cache reset error:', error);
    }
  }

  // Cache warming utilities
  async warmup(warmupFunctions: Array<() => Promise<void>>): Promise<void> {
    try {
      await Promise.allSettled(warmupFunctions.map(fn => fn()));
    } catch (error) {
      console.warn('Cache warmup error:', error);
    }
  }
}

// Cache key generators
export class CacheKeys {
  static articles = {
    list: (filters: Record<string, any>) => 
      `articles:list:${JSON.stringify(filters)}`,
    detail: (id: string) => `articles:detail:${id}`,
    stats: (id: string) => `articles:stats:${id}`,
    search: (query: string, filters: Record<string, any>) => 
      `articles:search:${query}:${JSON.stringify(filters)}`,
    public: (filters: Record<string, any>) => 
      `articles:public:${JSON.stringify(filters)}`,
  };

  static categories = {
    list: () => 'categories:list',
    detail: (id: string) => `categories:detail:${id}`,
    withStats: () => 'categories:with-stats',
  };

  static users = {
    profile: (id: string) => `users:profile:${id}`,
    session: (id: string) => `users:session:${id}`,
    permissions: (id: string) => `users:permissions:${id}`,
  };

  static homepage = {
    public: () => 'homepage:public',
    sections: () => 'homepage:sections',
  };

  static comments = {
    byArticle: (articleId: string) => `comments:article:${articleId}`,
    stats: (articleId: string) => `comments:stats:${articleId}`,
  };
}
