import { Injectable, Logger } from '@nestjs/common';
import { Repository, SelectQueryBuilder, EntityManager, ObjectLiteral } from 'typeorm';
import { CacheService } from '../cache/cache.service';

export interface QueryOptimizationOptions {
  enableCache?: boolean;
  cacheTTL?: number;
  enablePagination?: boolean;
  maxLimit?: number;
  enableEagerLoading?: boolean;
  relations?: string[];
  indexes?: string[];
}

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private queryStats = new Map<string, { count: number; avgTime: number; lastUsed: Date }>();

  constructor(private cacheService: CacheService) {}

  // Optimize SELECT queries with automatic caching and relation loading
  async optimizeQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: QueryOptimizationOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey(queryBuilder);

    try {
      // Check cache first if enabled
      if (options.enableCache) {
        const cached = await this.cacheService.get<T[]>(
          queryKey,
          'queries'
        );
        if (cached) {
          this.updateQueryStats(queryKey, Date.now() - startTime, true);
          return cached;
        }
      }

      // Apply optimizations
      this.applyQueryOptimizations(queryBuilder, options);

      // Execute query
      const result = await queryBuilder.getMany();

      // Cache result if enabled
      if (options.enableCache) {
        await this.cacheService.set(
          queryKey,
          result,
          {
            ttl: options.cacheTTL || 300,
            tags: ['queries'],
            namespace: 'queries'
          }
        );
      }

      this.updateQueryStats(queryKey, Date.now() - startTime, false);
      return result;

    } catch (error) {
      this.logger.error(`Query optimization failed for key ${queryKey}:`, error);
      throw error;
    }
  }

  // Optimize paginated queries
  async optimizePaginatedQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 10,
    options: QueryOptimizationOptions = {}
  ): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const startTime = Date.now();
    const maxLimit = options.maxLimit || 100;
    const actualLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * actualLimit;

    const queryKey = this.generatePaginatedQueryKey(queryBuilder, page, actualLimit);

    try {
      // Check cache first
      if (options.enableCache) {
        const cached = await this.cacheService.get<any>(queryKey, 'paginated');
        if (cached) {
          this.updateQueryStats(queryKey, Date.now() - startTime, true);
          return cached;
        }
      }

      // Apply optimizations
      this.applyQueryOptimizations(queryBuilder, options);

      // Get total count (optimized with separate query)
      const totalQuery = queryBuilder.clone();
      const total = await totalQuery.getCount();

      // Apply pagination
      queryBuilder.skip(offset).take(actualLimit);

      // Execute paginated query
      const data = await queryBuilder.getMany();

      const result = {
        data,
        total,
        page,
        limit: actualLimit,
        totalPages: Math.ceil(total / actualLimit)
      };

      // Cache result
      if (options.enableCache) {
        await this.cacheService.set(
          queryKey,
          result,
          {
            ttl: options.cacheTTL || 300,
            tags: ['paginated', 'queries'],
            namespace: 'paginated'
          }
        );
      }

      this.updateQueryStats(queryKey, Date.now() - startTime, false);
      return result;

    } catch (error) {
      this.logger.error(`Paginated query optimization failed:`, error);
      throw error;
    }
  }

  // Batch loading to prevent N+1 queries
  async batchLoad<T extends ObjectLiteral, K extends string | number>(
    repository: Repository<T>,
    ids: K[],
    relationField: string,
    options: QueryOptimizationOptions = {}
  ): Promise<Map<K, T[]>> {
    if (ids.length === 0) return new Map();

    const cacheKey = `batch:${repository.metadata.tableName}:${relationField}:${ids.join(',')}`;

    try {
      // Check cache
      if (options.enableCache) {
        const cached = await this.cacheService.get<Record<string, T[]>>(cacheKey, 'batch');
        if (cached) {
          const map = new Map<K, T[]>();
          for (const [k, v] of Object.entries(cached)) {
            map.set(k as unknown as K, v);
          }
          return map;
        }
      }

      // Batch load with single query
      const queryBuilder = repository.createQueryBuilder('entity');
      
      // Add relation joins if specified
      if (options.relations) {
        options.relations.forEach(relation => {
          queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
        });
      }

      queryBuilder.whereInIds(ids);
      const entities = await queryBuilder.getMany();

      // Group by the relation field
      const result = new Map<K, T[]>();
      entities.forEach(entity => {
        const key = (entity as any)[relationField];
        if (!result.has(key)) {
          result.set(key, []);
        }
        result.get(key)!.push(entity);
      });

      // Cache result
      if (options.enableCache) {
        await this.cacheService.set(
          cacheKey,
          Object.fromEntries(result),
          {
            ttl: options.cacheTTL || 300,
            tags: ['batch'],
            namespace: 'batch'
          }
        );
      }

      return result;

    } catch (error) {
      this.logger.error(`Batch loading failed:`, error);
      return new Map();
    }
  }

  // Optimize search queries with full-text search
  async optimizeSearchQuery<T extends ObjectLiteral>(
    repository: Repository<T>,
    searchTerm: string,
    searchFields: string[],
    options: QueryOptimizationOptions & {
      fuzzySearch?: boolean;
      minScore?: number;
    } = {}
  ): Promise<T[]> {
    const cacheKey = `search:${repository.metadata.tableName}:${searchTerm}:${searchFields.join(',')}`;

    try {
      // Check cache
      if (options.enableCache) {
        const cached = await this.cacheService.get<T[]>(cacheKey, 'search');
        if (cached) {
          return cached;
        }
      }

      const queryBuilder = repository.createQueryBuilder('entity');

      // Build search conditions
      if (options.fuzzySearch) {
        // Use full-text search with ranking
        const searchConditions = searchFields.map((field, index) => {
          return `to_tsvector('english', entity.${field}) @@ plainto_tsquery('english', :searchTerm${index})`;
        });

        queryBuilder.where(`(${searchConditions.join(' OR ')})`, 
          searchFields.reduce((params, _, index) => {
            params[`searchTerm${index}`] = searchTerm;
            return params;
          }, {} as any)
        );

        // Add ranking for relevance
        const rankingSelect = searchFields.map((field, index) => {
          return `ts_rank(to_tsvector('english', entity.${field}), plainto_tsquery('english', :rankTerm${index}))`;
        }).join(' + ');

        queryBuilder.addSelect(`(${rankingSelect})`, 'search_rank')
          .setParameters(
            searchFields.reduce((params, _, index) => {
              params[`rankTerm${index}`] = searchTerm;
              return params;
            }, {} as any)
          )
          .orderBy('search_rank', 'DESC');

        if (options.minScore) {
          queryBuilder.having(`(${rankingSelect}) > :minScore`, { minScore: options.minScore });
        }
      } else {
        // Use ILIKE for simpler search
        const searchConditions = searchFields.map((field, index) => {
          return `entity.${field} ILIKE :searchTerm${index}`;
        });

        queryBuilder.where(`(${searchConditions.join(' OR ')})`, 
          searchFields.reduce((params, _, index) => {
            params[`searchTerm${index}`] = `%${searchTerm}%`;
            return params;
          }, {} as any)
        );
      }

      // Apply other optimizations
      this.applyQueryOptimizations(queryBuilder, options);

      const result = await queryBuilder.getMany();

      // Cache result
      if (options.enableCache) {
        await this.cacheService.set(
          cacheKey,
          result,
          {
            ttl: options.cacheTTL || 600, // Longer cache for search
            tags: ['search'],
            namespace: 'search'
          }
        );
      }

      return result;

    } catch (error) {
      this.logger.error(`Search query optimization failed:`, error);
      throw error;
    }
  }

  // Apply common query optimizations
  private applyQueryOptimizations<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: QueryOptimizationOptions
  ): void {
    // Add eager loading for specified relations
    if (options.enableEagerLoading && options.relations) {
      options.relations.forEach(relation => {
        queryBuilder.leftJoinAndSelect(`${queryBuilder.alias}.${relation}`, relation);
      });
    }

    // Add query hints for better performance
    queryBuilder.cache(options.enableCache ? (options.cacheTTL || 300) * 1000 : false);
  }

  // Generate cache key for queries
  private generateQueryKey<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>): string {
    const sql = queryBuilder.getSql();
    const parameters = JSON.stringify(queryBuilder.getParameters());
    return `query:${Buffer.from(sql + parameters).toString('base64').slice(0, 50)}`;
  }

  // Generate cache key for paginated queries
  private generatePaginatedQueryKey<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number,
    limit: number
  ): string {
    const baseKey = this.generateQueryKey(queryBuilder);
    return `${baseKey}:page:${page}:limit:${limit}`;
  }

  // Update query statistics
  private updateQueryStats(queryKey: string, executionTime: number, fromCache: boolean): void {
    const existing = this.queryStats.get(queryKey);
    if (existing) {
      existing.count++;
      existing.avgTime = (existing.avgTime + executionTime) / 2;
      existing.lastUsed = new Date();
    } else {
      this.queryStats.set(queryKey, {
        count: 1,
        avgTime: executionTime,
        lastUsed: new Date()
      });
    }

    // Log slow queries
    if (executionTime > 1000 && !fromCache) {
      this.logger.warn(`Slow query detected: ${queryKey} took ${executionTime}ms`);
    }
  }

  // Get query performance statistics
  getQueryStats(): Array<{
    queryKey: string;
    count: number;
    avgTime: number;
    lastUsed: Date;
  }> {
    return Array.from(this.queryStats.entries()).map(([queryKey, stats]) => ({
      queryKey,
      ...stats
    }));
  }

  // Clear query statistics
  clearStats(): void {
    this.queryStats.clear();
  }

  // Suggest indexes based on query patterns
  suggestIndexes(): Array<{
    table: string;
    columns: string[];
    type: 'btree' | 'gin' | 'gist';
    reason: string;
  }> {
    const suggestions: Array<{
      table: string;
      columns: string[];
      type: 'btree' | 'gin' | 'gist';
      reason: string;
    }> = [];

    // Analyze query patterns and suggest indexes
    // This is a simplified implementation
    for (const [queryKey, stats] of this.queryStats.entries()) {
      if (stats.count > 10 && stats.avgTime > 500) {
        suggestions.push({
          table: 'unknown', // Would need to parse query to determine
          columns: ['unknown'],
          type: 'btree',
          reason: `Frequently used slow query: ${stats.count} times, avg ${stats.avgTime}ms`
        });
      }
    }

    return suggestions;
  }
}
