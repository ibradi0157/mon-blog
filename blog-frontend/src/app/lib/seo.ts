// SEO utilities for structured data and meta tags
import type { Metadata } from 'next';

export interface ArticleSEO {
  title: string;
  description: string;
  content: string;
  coverUrl?: string;
  thumbnails?: string[];
  url?: string; // canonical URL for the article
  author: {
    name: string;
    url?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  readingTime?: number;
}

export interface WebsiteSEO {
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale?: string;
  type?: 'website' | 'article' | 'blog';
}

// Generate structured data for articles
export function generateArticleStructuredData(article: ArticleSEO, baseUrl: string): Record<string, any> {
  const images: string[] = [];
  const toAbs = (u?: string) => (u && (u.startsWith("http://") || u.startsWith("https://"))) ? u : (u ? `${baseUrl}${u}` : undefined);
  const coverAbs = toAbs(article.coverUrl);
  if (coverAbs) images.push(coverAbs);
  if (Array.isArray(article.thumbnails)) {
    for (const t of article.thumbnails) {
      const abs = toAbs(t);
      if (abs) images.push(abs);
    }
  }

  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    ...(images.length ? { image: images } : {}),
    "author": {
      "@type": "Person",
      "name": article.author.name,
      ...(article.author.url ? { url: article.author.url } : {})
    },
    "publisher": {
      "@type": "Organization",
      "name": "Mon Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt || article.publishedAt,
    "isAccessibleForFree": true,
    ...(article.content ? { articleBody: extractTextFromHtml(article.content) } : {}),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url ? article.url : baseUrl
    }
  };

  // Add reading time if available
  if (article.readingTime) {
    structuredData["timeRequired"] = `PT${article.readingTime}M`;
  }

  // Add category
  if (article.category) {
    structuredData["articleSection"] = article.category;
  }

  // Add keywords
  if (article.tags && article.tags.length > 0) {
    structuredData["keywords"] = article.tags.join(", ");
  }

  return structuredData;
}

// Generate structured data for website
export function generateWebsiteStructuredData(website: WebsiteSEO): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": website.siteName,
    "description": website.description,
    "url": website.url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${website.url}/articles?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Generate structured data for blog
export function generateBlogStructuredData(baseUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Mon Blog",
    "description": "Découvrez des articles de qualité sur la technologie, l'innovation et bien plus encore.",
    "url": baseUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Mon Blog",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    }
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

// Generate Open Graph metadata
export function generateOpenGraphMeta(data: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  locale?: string;
}): Partial<Metadata> {
  return {
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.url,
      siteName: data.siteName || 'Mon Blog',
      locale: data.locale || 'fr_FR',
      type: data.type || 'website',
      images: data.image ? [
        {
          url: data.image,
          width: 1200,
          height: 630,
          alt: data.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: data.image ? [data.image] : undefined,
    }
  };
}

// Calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Extract text from HTML content
export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Generate meta description from content
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  const text = extractTextFromHtml(content);
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

// SEO-friendly URL slug generation
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim();
}

// Validate and optimize images for SEO
export function optimizeImageForSEO(imageUrl: string, alt: string): {
  src: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
} {
  return {
    src: imageUrl,
    alt: alt || 'Image',
    loading: 'lazy',
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  };
}

// Generate canonical URL
export function generateCanonicalUrl(path: string, baseUrl: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}${cleanPath}`;
}

// Generate hreflang attributes for internationalization
export function generateHreflangLinks(currentPath: string, baseUrl: string, locales: string[] = ['fr']): Array<{ rel: string; hreflang: string; href: string }> {
  return locales.map(locale => ({
    rel: 'alternate',
    hreflang: locale,
    href: `${baseUrl}${locale === 'fr' ? '' : `/${locale}`}${currentPath}`
  }));
}

// SEO score calculator
export function calculateSEOScore(data: {
  title: string;
  description: string;
  content: string;
  headings: string[];
  images: Array<{ alt: string; src: string }>;
  links: Array<{ text: string; href: string; external: boolean }>;
}): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  let score = 0;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Title optimization (20 points)
  if (data.title.length >= 30 && data.title.length <= 60) {
    score += 20;
  } else if (data.title.length < 30) {
    issues.push('Le titre est trop court (moins de 30 caractères)');
    suggestions.push('Rallongez le titre pour inclure plus de mots-clés pertinents');
  } else {
    issues.push('Le titre est trop long (plus de 60 caractères)');
    suggestions.push('Raccourcissez le titre pour éviter la troncature dans les résultats de recherche');
  }

  // Description optimization (20 points)
  if (data.description.length >= 120 && data.description.length <= 160) {
    score += 20;
  } else if (data.description.length < 120) {
    issues.push('La description est trop courte (moins de 120 caractères)');
    suggestions.push('Étoffez la description pour mieux décrire le contenu');
  } else {
    issues.push('La description est trop longue (plus de 160 caractères)');
    suggestions.push('Raccourcissez la description pour éviter la troncature');
  }

  // Content length (15 points)
  const wordCount = data.content.split(/\s+/).length;
  if (wordCount >= 300) {
    score += 15;
  } else {
    issues.push(`Le contenu est trop court (${wordCount} mots)`);
    suggestions.push('Ajoutez plus de contenu pour améliorer la pertinence (minimum 300 mots)');
  }

  // Headings structure (15 points)
  if (data.headings.length >= 2) {
    score += 15;
  } else {
    issues.push('Pas assez de titres de section');
    suggestions.push('Ajoutez des titres H2, H3 pour structurer le contenu');
  }

  // Images optimization (15 points)
  const imagesWithAlt = data.images.filter(img => img.alt && img.alt.trim() !== '');
  if (data.images.length > 0 && imagesWithAlt.length === data.images.length) {
    score += 15;
  } else if (data.images.length > 0) {
    issues.push(`${data.images.length - imagesWithAlt.length} image(s) sans attribut alt`);
    suggestions.push('Ajoutez des descriptions alt à toutes les images');
  }

  // Internal links (10 points)
  const internalLinks = data.links.filter(link => !link.external);
  if (internalLinks.length >= 2) {
    score += 10;
  } else {
    suggestions.push('Ajoutez des liens internes vers d\'autres articles pertinents');
  }

  // External links (5 points)
  const externalLinks = data.links.filter(link => link.external);
  if (externalLinks.length >= 1) {
    score += 5;
  } else {
    suggestions.push('Ajoutez des liens vers des sources externes de qualité');
  }

  return { score, issues, suggestions };
}
