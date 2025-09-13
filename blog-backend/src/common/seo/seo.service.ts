import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from '../../articles/article.entity';
import { Category } from '../../categories/category.entity';
import { CacheService } from '../cache/cache.service';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: any;
  robots?: string;
  alternateUrls?: Array<{ hreflang: string; href: string }>;
}

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

@Injectable()
export class SEOService {
  private readonly logger = new Logger(SEOService.name);
  private readonly baseUrl: string;
  private readonly siteName: string;
  private readonly defaultImage: string;

  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private cacheService: CacheService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    this.siteName = this.configService.get('SITE_NAME', 'Mon Blog');
    this.defaultImage = this.configService.get('DEFAULT_OG_IMAGE', '/images/default-og.jpg');
  }

  // Generate SEO metadata for articles (supports slug or id)
  async generateArticleMetadata(identifier: string): Promise<SEOMetadata> {
    const cacheKey = `seo:article:${identifier}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Try by slug first, then fallback to id
        let article = await this.articleRepo.findOne({ where: { slug: identifier, isPublished: true } });
        if (!article) {
          article = await this.articleRepo.findOne({ where: { id: identifier, isPublished: true } });
        }

        if (!article) {
          throw new Error('Article not found');
        }

        const keywords = this.extractKeywords(article.content, article.tags || undefined);
        const readingTime = this.calculateReadingTime(article.content);
        
        return {
          title: `${article.title} | ${this.siteName}`,
          description: article.excerpt || this.generateExcerpt(article.content),
          keywords,
          canonicalUrl: `${this.baseUrl}/articles/${article.slug || article.id}`,
          ogTitle: article.title,
          ogDescription: article.excerpt || this.generateExcerpt(article.content),
          ogImage: article.coverUrl || this.defaultImage,
          ogType: 'article',
          twitterCard: 'summary_large_image',
          twitterTitle: article.title,
          twitterDescription: article.excerpt || this.generateExcerpt(article.content),
          twitterImage: article.coverUrl || this.defaultImage,
          robots: 'index,follow',
          structuredData: this.generateArticleStructuredData(article, readingTime),
        };
      },
      { ttl: 3600, tags: ['seo', 'articles'], namespace: 'seo' }
    );
  }

  // Generate SEO metadata for category pages
  async generateCategoryMetadata(categorySlug: string): Promise<SEOMetadata> {
    const cacheKey = `seo:category:${categorySlug}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const category = await this.categoryRepo.findOne({
          where: { slug: categorySlug },
        });

        if (!category) {
          throw new Error('Category not found');
        }

        const articleCount = await this.articleRepo.count({
          where: { isPublished: true, category: { id: category.id } as any },
        });

        return {
          title: `${category.name} Articles | ${this.siteName}`,
          description: category.description || `Explore ${articleCount} articles in ${category.name} category`,
          keywords: [category.name, 'articles', 'blog'],
          canonicalUrl: `${this.baseUrl}/categories/${category.slug || encodeURIComponent(category.name)}`,
          ogTitle: `${category.name} | ${this.siteName}`,
          ogDescription: category.description || `Discover articles about ${category.name}`,
          ogImage: this.defaultImage,
          ogType: 'website',
          robots: 'index,follow',
          structuredData: this.generateCategoryStructuredData({ name: category.name, slug: category.slug }, articleCount),
        };
      },
      { ttl: 3600, tags: ['seo', 'categories'], namespace: 'seo' }
    );
  }

  // Generate homepage metadata
  async generateHomepageMetadata(): Promise<SEOMetadata> {
    const cacheKey = 'seo:homepage';
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const totalArticles = await this.articleRepo.count({
          where: { isPublished: true },
        });

        const categories = await this.categoryRepo.find({
          select: ['name'],
          take: 10,
        });

        const keywords = [
          'blog',
          'articles',
          'technology',
          'programming',
          ...categories.map(c => c.name.toLowerCase()),
        ];

        return {
          title: `${this.siteName} - Your Source for Quality Content`,
          description: `Discover ${totalArticles}+ high-quality articles on technology, programming, and more. Stay updated with the latest insights and tutorials.`,
          keywords,
          canonicalUrl: this.baseUrl,
          ogTitle: this.siteName,
          ogDescription: `Quality content and insights on technology, programming, and more`,
          ogImage: this.defaultImage,
          ogType: 'website',
          robots: 'index,follow',
          structuredData: this.generateWebsiteStructuredData(),
        };
      },
      { ttl: 3600, tags: ['seo', 'homepage'], namespace: 'seo' }
    );
  }

  // Generate sitemap
  async generateSitemap(): Promise<SitemapEntry[]> {
    const cacheKey = 'seo:sitemap';
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const entries: SitemapEntry[] = [];

        // Homepage
        entries.push({
          url: this.baseUrl,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 1.0,
        });

        // Articles
        const articles = await this.articleRepo.find({
          where: { isPublished: true },
          select: ['id', 'slug', 'updatedAt'],
          order: { updatedAt: 'DESC' },
        });

        articles.forEach(article => {
          const a: any = article;
          entries.push({
            url: `${this.baseUrl}/articles/${a.slug || a.id}`,
            lastmod: a.updatedAt.toISOString(),
            changefreq: 'weekly',
            priority: 0.8,
          });
        });

        // Categories
        const categories = await this.categoryRepo.find({
          select: ['slug', 'updatedAt'],
        });

        categories.forEach(category => {
          const c: any = category;
          entries.push({
            url: `${this.baseUrl}/categories/${c.slug}`,
            lastmod: (c.updatedAt || new Date()).toISOString(),
            changefreq: 'weekly',
            priority: 0.6,
          });
        });

        // Static pages
        const staticPages = [
          { path: '/about', priority: 0.5 },
          { path: '/contact', priority: 0.5 },
          { path: '/privacy', priority: 0.3 },
          { path: '/terms', priority: 0.3 },
        ];

        staticPages.forEach(page => {
          entries.push({
            url: `${this.baseUrl}${page.path}`,
            lastmod: new Date().toISOString(),
            changefreq: 'monthly',
            priority: page.priority,
          });
        });

        return entries;
      },
      { ttl: 3600, tags: ['seo', 'sitemap'], namespace: 'seo' }
    );
  }

  // Generate robots.txt
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /*.json$
Disallow: /*?*

Sitemap: ${this.baseUrl}/sitemap.xml`;
  }

  // Extract keywords from content
  private extractKeywords(content: string, tags?: string[]): string[] {
    const keywords = new Set<string>();

    // Add tags if available
    if (tags) {
      tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // Extract keywords from content (simplified implementation)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20);

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Get most frequent words
    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    sortedWords.forEach(word => keywords.add(word));

    return Array.from(keywords).slice(0, 15);
  }

  // Generate excerpt from content
  private generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  // Calculate reading time
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Generate structured data for articles
  private generateArticleStructuredData(article: any, readingTime: number): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: this.generateExcerpt(article.content),
      image: article.coverUrl || this.defaultImage,
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
        },
      },
      datePublished: article.createdAt?.toISOString(),
      dateModified: article.updatedAt?.toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}/articles/${article.id}`,
      },
      articleSection: article.category?.name,
      wordCount: article.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
      timeRequired: `PT${readingTime}M`,
      interactionStatistic: [],
    };
  }

  // Generate structured data for categories
  private generateCategoryStructuredData(category: any, articleCount: number): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category.name} Articles`,
      description: `Articles in ${category.name} category`,
      url: `${this.baseUrl}/categories/${encodeURIComponent(category.name)}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: articleCount,
        itemListElement: [], // Would be populated with actual articles
      },
    };
  }

  // Generate structured data for website
  private generateWebsiteStructuredData(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.baseUrl,
      description: 'Quality content and insights on technology, programming, and more',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      sameAs: [
        // Add social media URLs here
      ],
    };
  }

  // Generate breadcrumb structured data
  generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  // Invalidate SEO cache
  async invalidateSEOCache(type: 'article' | 'category' | 'homepage' | 'all', id?: string): Promise<void> {
    switch (type) {
      case 'article':
        if (id) {
          await this.cacheService.del(`seo:article:${id}`, 'seo');
        }
        await this.cacheService.invalidateTag('articles');
        break;
      case 'category':
        if (id) {
          await this.cacheService.del(`seo:category:${id}`, 'seo');
        }
        await this.cacheService.invalidateTag('categories');
        break;
      case 'homepage':
        await this.cacheService.del('seo:homepage', 'seo');
        break;
      case 'all':
        await this.cacheService.invalidateTag('seo');
        break;
    }

    // Always invalidate sitemap when content changes
    await this.cacheService.del('seo:sitemap', 'seo');
  }

  // Generate meta tags HTML
  generateMetaTagsHTML(metadata: SEOMetadata): string {
    const tags: string[] = [];

    // Basic meta tags
    tags.push(`<title>${this.escapeHtml(metadata.title)}</title>`);
    tags.push(`<meta name="description" content="${this.escapeHtml(metadata.description)}">`);
    tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}">`);
    tags.push(`<link rel="canonical" href="${metadata.canonicalUrl}">`);
    
    if (metadata.robots) {
      tags.push(`<meta name="robots" content="${metadata.robots}">`);
    }

    // Open Graph tags
    if (metadata.ogTitle) {
      tags.push(`<meta property="og:title" content="${this.escapeHtml(metadata.ogTitle)}">`);
    }
    if (metadata.ogDescription) {
      tags.push(`<meta property="og:description" content="${this.escapeHtml(metadata.ogDescription)}">`);
    }
    if (metadata.ogImage) {
      tags.push(`<meta property="og:image" content="${metadata.ogImage}">`);
    }
    if (metadata.ogType) {
      tags.push(`<meta property="og:type" content="${metadata.ogType}">`);
    }
    tags.push(`<meta property="og:url" content="${metadata.canonicalUrl}">`);

    // Twitter Card tags
    if (metadata.twitterCard) {
      tags.push(`<meta name="twitter:card" content="${metadata.twitterCard}">`);
    }
    if (metadata.twitterTitle) {
      tags.push(`<meta name="twitter:title" content="${this.escapeHtml(metadata.twitterTitle)}">`);
    }
    if (metadata.twitterDescription) {
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(metadata.twitterDescription)}">`);
    }
    if (metadata.twitterImage) {
      tags.push(`<meta name="twitter:image" content="${metadata.twitterImage}">`);
    }

    // Structured data
    if (metadata.structuredData) {
      tags.push(`<script type="application/ld+json">${JSON.stringify(metadata.structuredData)}</script>`);
    }

    // Alternate URLs for internationalization
    if (metadata.alternateUrls) {
      metadata.alternateUrls.forEach(alt => {
        tags.push(`<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}">`);
      });
    }

    return tags.join('\n');
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
