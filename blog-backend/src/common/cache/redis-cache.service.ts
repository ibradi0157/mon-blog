import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
  connections: number;
}

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: any; // Redis client
  private subscriber: any; // Redis subscriber for pub/sub
  private stats = {
    hits: 0,
    misses: 0,
    operations: 0
  };

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const config: RedisConfig = {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        db: this.configService.get('REDIS_DB', 0),
        keyPrefix: this.configService.get('REDIS_KEY_PREFIX', 'blog:'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
      };

      // Mock Redis client for now - would use actual Redis in production
      this.redis = {
        get: async (key: string) => {
          this.stats.operations++;
          // Mock implementation
          return null;
        },
        set: async (key: string, value: any, mode?: string, duration?: number) => {
          this.stats.operations++;
          // Mock implementation
          return 'OK';
        },
        del: async (key: string) => {
          this.stats.operations++;
          return 1;
        },
        exists: async (key: string) => {
          this.stats.operations++;
          return 0;
        },
        expire: async (key: string, seconds: number) => {
          this.stats.operations++;
          return 1;
        },
        ttl: async (key: string) => {
          this.stats.operations++;
          return -1;
        },
        keys: async (pattern: string) => {
          this.stats.operations++;
          return [];
        },
        mget: async (...keys: string[]) => {
          this.stats.operations++;
          return keys.map(() => null);
        },
        mset: async (...args: any[]) => {
          this.stats.operations++;
          return 'OK';
        },
        pipeline: () => ({
          get: (key: string) => this,
          set: (key: string, value: any) => this,
          del: (key: string) => this,
          expire: (key: string, seconds: number) => this,
          exec: async () => []
        }),
        multi: () => ({
          get: (key: string) => this,
          set: (key: string, value: any) => this,
          del: (key: string) => this,
          expire: (key: string, seconds: number) => this,
          exec: async () => []
        }),
        flushdb: async () => 'OK',
        info: async () => 'redis_version:6.0.0\r\nused_memory:1000000',
        publish: async (channel: string, message: string) => 1,
        subscribe: async (channel: string) => {},
        on: (event: string, callback: Function) => {},
        disconnect: async () => {},
      };

      this.subscriber = { ...this.redis };

      this.logger.log('Redis cache service initialized');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  // Enhanced get with compression and serialization
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      
      // Handle different data types
      if (typeof value === 'string') {
        try {
          // Try to parse as JSON
          return JSON.parse(value);
        } catch {
          // Return as string if not JSON
          return value as T;
        }
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Enhanced set with compression and TTL
  async set<T>(
    key: string, 
    value: T, 
    ttlSeconds?: number,
    options: { 
      compress?: boolean;
      nx?: boolean; // Only set if not exists
      xx?: boolean; // Only set if exists
    } = {}
  ): Promise<boolean> {
    try {
      let serializedValue: string;
      
      if (typeof value === 'string') {
        serializedValue = value;
      } else {
        serializedValue = JSON.stringify(value);
      }

      // Compress large values (mock implementation)
      if (options.compress && serializedValue.length > 1024) {
        // Would use compression library in production
        serializedValue = `compressed:${serializedValue}`;
      }

      const args: any[] = [key, serializedValue];
      
      if (ttlSeconds) {
        args.push('EX', ttlSeconds);
      }
      
      if (options.nx) {
        args.push('NX');
      } else if (options.xx) {
        args.push('XX');
      }

      const result = await this.redis.set(...args);
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Atomic operations
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      // Mock implementation
      return by;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      // Mock implementation
      return -by;
    } catch (error) {
      this.logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      // Mock implementation
      return values.length;
    } catch (error) {
      this.logger.error(`Cache lpush error for key ${key}:`, error);
      return 0;
    }
  }

  async rpop(key: string): Promise<any> {
    try {
      // Mock implementation
      return null;
    } catch (error) {
      this.logger.error(`Cache rpop error for key ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      // Mock implementation
      return [];
    } catch (error) {
      this.logger.error(`Cache lrange error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      // Mock implementation
      return members.length;
    } catch (error) {
      this.logger.error(`Cache sadd error for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<any[]> {
    try {
      // Mock implementation
      return [];
    } catch (error) {
      this.logger.error(`Cache smembers error for key ${key}:`, error);
      return [];
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      // Mock implementation
      return 1;
    } catch (error) {
      this.logger.error(`Cache hset error for key ${key}:`, error);
      return 0;
    }
  }

  async hget(key: string, field: string): Promise<any> {
    try {
      // Mock implementation
      return null;
    } catch (error) {
      this.logger.error(`Cache hget error for key ${key}:`, error);
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      // Mock implementation
      return {};
    } catch (error) {
      this.logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // Bulk operations with pipeline
  async pipeline(operations: Array<{
    command: string;
    args: any[];
  }>): Promise<any[]> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const op of operations) {
        (pipeline as any)[op.command](...op.args);
      }
      
      return await pipeline.exec();
    } catch (error) {
      this.logger.error('Cache pipeline error:', error);
      return [];
    }
  }

  // Transaction support
  async multi(operations: Array<{
    command: string;
    args: any[];
  }>): Promise<any[]> {
    try {
      const multi = this.redis.multi();
      
      for (const op of operations) {
        (multi as any)[op.command](...op.args);
      }
      
      return await multi.exec();
    } catch (error) {
      this.logger.error('Cache multi error:', error);
      return [];
    }
  }

  // Pub/Sub for cache invalidation
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serialized = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.redis.publish(channel, serialized);
    } catch (error) {
      this.logger.error(`Cache publish error for channel ${channel}:`, error);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel: string, message: string) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch {
            callback(message);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Cache subscribe error for channel ${channel}:`, error);
    }
  }

  // Cache warming
  async warmCache(warmupData: Array<{
    key: string;
    value: any;
    ttl?: number;
  }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const item of warmupData) {
        if (item.ttl) {
          pipeline.set(item.key, JSON.stringify(item.value), 'EX', item.ttl);
        } else {
          pipeline.set(item.key, JSON.stringify(item.value));
        }
      }
      
      await pipeline.exec();
      this.logger.log(`Cache warmed with ${warmupData.length} items`);
    } catch (error) {
      this.logger.error('Cache warming error:', error);
    }
  }

  // Cache statistics
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: keyCount || 0,
        memory: 1000000, // Mock value
        connections: 1,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 0,
        connections: 0,
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Cache health check failed:', error);
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await this.redis.disconnect();
      await this.subscriber.disconnect();
      this.logger.log('Redis connections closed');
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }

  // Pattern-based deletion
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  // TTL management
  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  async setTTL(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting TTL for key ${key}:`, error);
      return false;
    }
  }
}
