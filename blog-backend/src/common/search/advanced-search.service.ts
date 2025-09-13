import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Article } from '../../articles/article.entity';
import { Category } from '../../categories/category.entity';
import { User } from '../../users/user.entity';
import { CacheService } from '../cache/cache.service';
import { QueryOptimizerService } from '../performance/query-optimizer.service';

export interface SearchFilters {
  categories?: string[];
  authors?: string[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minReadingTime?: number;
  maxReadingTime?: number;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  publishedAt: Date;
  readingTime: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  relevanceScore?: number;
  highlightedExcerpt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchTime: number;
  suggestions?: string[];
  facets?: {
    categories: Array<{ name: string; count: number }>;
    authors: Array<{ name: string; count: number }>;
    tags: Array<{ name: string; count: number }>;
  };
}

@Injectable()
export class AdvancedSearchService {
  private readonly logger = new Logger(AdvancedSearchService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private cacheService: CacheService,
    private queryOptimizer: QueryOptimizerService,
  ) {}

  // Main search method with full-text search and advanced filtering
  async search(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateSearchCacheKey(query, filters, page, limit);

    try {
      const cached = await this.cacheService.get<SearchResponse>(cacheKey, 'search');
      if (cached) {
        cached.searchTime = Date.now() - startTime;
        return cached;
      }

      // Build the search query
      const queryBuilder = this.buildSearchQuery(query, filters);
      
      // Get total count for pagination
      const total = await queryBuilder.getCount();
      
      // Apply pagination and sorting
      this.applySortingAndPagination(queryBuilder, filters, page, limit);

      // Execute the optimized query
      const articles = await this.queryOptimizer.optimizeQuery(
        queryBuilder,
        {
          enableCache: true,
          cacheTTL: 600,
          enableEagerLoading: true,
          relations: ['category', 'author', 'stats'],
        }
      );

      // Process results and calculate relevance scores
      const results = await this.processSearchResults(articles, query);

      // Generate search suggestions if no results
      const suggestions = results.length === 0 ? await this.generateSuggestions(query) : undefined;

      // Generate facets for filtering
      const facets = await this.generateFacets(query, filters);

      const response: SearchResponse = {
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        searchTime: Date.now() - startTime,
        suggestions,
        facets,
      };

      // Cache the results
      await this.cacheService.set(
        cacheKey,
        response,
        {
          ttl: 600,
          tags: ['search', 'articles'],
          namespace: 'search'
        }
      );

      return response;

    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  // Build the main search query with full-text search
  private buildSearchQuery(query: string, filters: SearchFilters): SelectQueryBuilder<Article> {
    const queryBuilder = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.stats', 'stats')
      .where('article.status = :status', { status: 'published' });

    // Full-text search
    if (query && query.trim()) {
      const searchTerms = this.preprocessSearchQuery(query);
      
      // Use PostgreSQL full-text search with ranking
      queryBuilder
        .andWhere(`
          to_tsvector('english', article.title || ' ' || COALESCE(article.excerpt, '') || ' ' || article.content) 
          @@ plainto_tsquery('english', :searchQuery)
        `, { searchQuery: searchTerms })
        .addSelect(`
          ts_rank(
            to_tsvector('english', article.title || ' ' || COALESCE(article.excerpt, '') || ' ' || article.content),
            plainto_tsquery('english', :searchQuery)
          )
        `, 'relevance_score')
        .setParameter('searchQuery', searchTerms);
    }

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    return queryBuilder;
  }

  // Apply various filters to the query
  private applyFilters(queryBuilder: SelectQueryBuilder<Article>, filters: SearchFilters): void {
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      queryBuilder.andWhere('category.slug IN (:...categories)', { 
        categories: filters.categories 
      });
    }

    // Author filter
    if (filters.authors && filters.authors.length > 0) {
      queryBuilder.andWhere('author.id IN (:...authors)', { 
        authors: filters.authors 
      });
    }

    // Tags filter (assuming tags are stored as JSON array)
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map((tag, index) => 
        `article.tags @> :tag${index}`
      );
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`, 
        filters.tags.reduce((params, tag, index) => {
          params[`tag${index}`] = JSON.stringify([tag]);
          return params;
        }, {} as any)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      queryBuilder.andWhere('article.publishedAt >= :dateFrom', { 
        dateFrom: filters.dateFrom 
      });
    }
    if (filters.dateTo) {
      queryBuilder.andWhere('article.publishedAt <= :dateTo', { 
        dateTo: filters.dateTo 
      });
    }

    // Reading time filter (calculated from content length)
    if (filters.minReadingTime || filters.maxReadingTime) {
      const wordsPerMinute = 200;
      
      if (filters.minReadingTime) {
        const minWords = filters.minReadingTime * wordsPerMinute;
        queryBuilder.andWhere(
          `LENGTH(REGEXP_REPLACE(article.content, '<[^>]*>', '', 'g')) / 5 >= :minWords`,
          { minWords }
        );
      }
      
      if (filters.maxReadingTime) {
        const maxWords = filters.maxReadingTime * wordsPerMinute;
        queryBuilder.andWhere(
          `LENGTH(REGEXP_REPLACE(article.content, '<[^>]*>', '', 'g')) / 5 <= :maxWords`,
          { maxWords }
        );
      }
    }
  }

  // Apply sorting and pagination
  private applySortingAndPagination(
    queryBuilder: SelectQueryBuilder<Article>,
    filters: SearchFilters,
    page: number,
    limit: number
  ): void {
    const offset = (page - 1) * limit;

    // Apply sorting
    switch (filters.sortBy) {
      case 'relevance':
        // Relevance is only available when there's a search query
        queryBuilder.orderBy('relevance_score', filters.sortOrder === 'asc' ? 'ASC' : 'DESC');
        break;
      case 'date':
        queryBuilder.orderBy('article.publishedAt', filters.sortOrder === 'asc' ? 'ASC' : 'DESC');
        break;
      case 'popularity':
        queryBuilder.orderBy('stats.views', filters.sortOrder === 'asc' ? 'ASC' : 'DESC');
        break;
      case 'title':
        queryBuilder.orderBy('article.title', filters.sortOrder === 'asc' ? 'ASC' : 'DESC');
        break;
      default:
        // Default sorting: relevance if search query, otherwise by date
        if (queryBuilder.getQuery().includes('ts_rank')) {
          queryBuilder.orderBy('relevance_score', 'DESC');
        } else {
          queryBuilder.orderBy('article.publishedAt', 'DESC');
        }
    }

    // Apply pagination
    queryBuilder.skip(offset).take(limit);
  }

  // Process search results and add relevance scores
  private async processSearchResults(articles: any[], query: string): Promise<SearchResult[]> {
    return articles.map(article => {
      const readingTime = this.calculateReadingTime(article.content);
      const highlightedExcerpt = this.generateHighlightedExcerpt(article, query);

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || this.generateExcerpt(article.content),
        content: article.content,
        featuredImage: article.featuredImage,
        publishedAt: article.publishedAt,
        readingTime,
        category: {
          id: article.category?.id,
          name: article.category?.name,
          slug: article.category?.slug,
        },
        author: {
          id: article.author?.id,
          displayName: article.author?.displayName,
          avatarUrl: article.author?.avatarUrl,
        },
        stats: {
          views: article.stats?.views || 0,
          likes: article.stats?.likes || 0,
          comments: article.stats?.comments || 0,
        },
        relevanceScore: article.relevance_score || 0,
        highlightedExcerpt,
      };
    });
  }

  // Generate search suggestions for empty results
  private async generateSuggestions(query: string): Promise<string[]> {
    const cacheKey = `search:suggestions:${query}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Simple suggestion algorithm - in production, use more sophisticated methods
        const suggestions: string[] = [];
        
        // Get popular search terms from article titles and content
        const popularTerms = await this.articleRepo
          .createQueryBuilder('article')
          .select('article.title')
          .where('article.status = :status', { status: 'published' })
          .orderBy('stats.views', 'DESC')
          .limit(100)
          .getMany();

        // Extract words from popular articles
        const words = new Set<string>();
        popularTerms.forEach(article => {
          const titleWords = article.title
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
          
          titleWords.forEach(word => words.add(word));
        });

        // Find similar words to the search query
        const queryWords = query.toLowerCase().split(/\s+/);
        const similarWords = Array.from(words).filter(word => {
          return queryWords.some(qWord => 
            word.includes(qWord) || qWord.includes(word) || 
            this.calculateLevenshteinDistance(word, qWord) <= 2
          );
        });

        suggestions.push(...similarWords.slice(0, 5));

        return suggestions;
      },
      { ttl: 3600, tags: ['search'], namespace: 'search' }
    );
  }

  // Generate facets for filtering
  private async generateFacets(query: string, filters: SearchFilters): Promise<SearchResponse['facets']> {
    const cacheKey = `search:facets:${query}:${JSON.stringify(filters)}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Build base query without category/author filters for facets
        const baseQuery = this.buildSearchQuery(query, {
          ...filters,
          categories: undefined,
          authors: undefined,
        });

        // Get category facets
        const categoryFacets = await baseQuery
          .clone()
          .select('category.name', 'name')
          .addSelect('COUNT(*)', 'count')
          .groupBy('category.id, category.name')
          .orderBy('count', 'DESC')
          .limit(10)
          .getRawMany();

        // Get author facets
        const authorFacets = await baseQuery
          .clone()
          .select('author.displayName', 'name')
          .addSelect('COUNT(*)', 'count')
          .groupBy('author.id, author.displayName')
          .orderBy('count', 'DESC')
          .limit(10)
          .getRawMany();

        // Get tag facets (simplified - would need proper JSON aggregation in production)
        const tagFacets: Array<{ name: string; count: number }> = [];

        return {
          categories: categoryFacets.map(f => ({ name: f.name, count: parseInt(f.count) })),
          authors: authorFacets.map(f => ({ name: f.name, count: parseInt(f.count) })),
          tags: tagFacets,
        };
      },
      { ttl: 600, tags: ['search'], namespace: 'search' }
    );
  }

  // Preprocess search query for better results
  private preprocessSearchQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .split(' ')
      .filter(word => word.length > 2) // Remove short words
      .join(' ');
  }

  // Generate highlighted excerpt
  private generateHighlightedExcerpt(article: any, query: string): string {
    if (!query) return article.excerpt || this.generateExcerpt(article.content);

    const content = article.content.replace(/<[^>]*>/g, ' '); // Remove HTML
    const queryWords = query.toLowerCase().split(/\s+/);
    
    // Find the best excerpt that contains query terms
    const sentences = content.split(/[.!?]+/);
    let bestSentence = '';
    let maxMatches = 0;

    sentences.forEach(sentence => {
      const matches = queryWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence.trim();
      }
    });

    if (bestSentence) {
      // Highlight matching terms
      let highlighted = bestSentence;
      queryWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlighted = highlighted.replace(regex, `<mark>$&</mark>`);
      });
      
      return highlighted.length > 200 
        ? highlighted.substring(0, 200) + '...'
        : highlighted;
    }

    return article.excerpt || this.generateExcerpt(article.content);
  }

  // Calculate reading time
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Generate excerpt from content
  private generateExcerpt(content: string, maxLength: number = 200): string {
    const plainText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  // Calculate Levenshtein distance for fuzzy matching
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Generate cache key for search results
  private generateSearchCacheKey(
    query: string,
    filters: SearchFilters,
    page: number,
    limit: number
  ): string {
    const filterString = JSON.stringify(filters);
    const keyData = `${query}:${filterString}:${page}:${limit}`;
    return `search:${Buffer.from(keyData).toString('base64').slice(0, 50)}`;
  }

  // Search autocomplete/suggestions
  async getAutocompleteSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const cacheKey = `search:autocomplete:${query}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        if (query.length < 2) return [];

        // Get suggestions from article titles
        const titleSuggestions = await this.articleRepo
          .createQueryBuilder('article')
          .select('article.title')
          .where('article.status = :status', { status: 'published' })
          .andWhere('LOWER(article.title) LIKE LOWER(:query)', { query: `%${query}%` })
          .orderBy('stats.views', 'DESC')
          .limit(limit)
          .getMany();

        return titleSuggestions.map(article => article.title);
      },
      { ttl: 300, tags: ['search'], namespace: 'search' }
    );
  }

  // Clear search cache
  async clearSearchCache(): Promise<void> {
    await this.cacheService.invalidateTag('search');
  }
}
