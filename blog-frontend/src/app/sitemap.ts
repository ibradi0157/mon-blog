import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  
  try {
    // Fetch articles for dynamic sitemap generation
    const articlesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/articles/public?limit=1000`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    const articlesData = await articlesResponse.json();
    const articles = articlesData.success ? articlesData.data : [];

    // Fetch categories
    const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories`, {
      next: { revalidate: 3600 }
    });
    
    const categoriesData = await categoriesResponse.json();
    const categories = categoriesData.success ? categoriesData.data : [];

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
    ];

    // Dynamic article pages
    const articlePages: MetadataRoute.Sitemap = articles.map((article: any) => ({
      url: `${baseUrl}/article/${article.id}`,
      lastModified: new Date(article.updatedAt || article.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
      url: `${baseUrl}/articles?category=${category.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...articlePages, ...categoryPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback to static pages only
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];
  }
}
