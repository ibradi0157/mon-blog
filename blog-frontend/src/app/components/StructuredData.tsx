"use client";
import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    // Add structured data to head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [data]);

  return null;
}

// Breadcrumb component with structured data
interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.href
    }))
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {index === items.length - 1 ? (
              <span className="text-slate-900 dark:text-slate-100 font-medium">
                {item.name}
              </span>
            ) : (
              <a 
                href={item.href} 
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {item.name}
              </a>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
