import { Card } from "@/app/components/ui/Card";
import { Heart, UserPlus } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";

interface ArticlesLikedListProps {
  articles: Array<{
    id: string;
    title: string;
    coverUrl?: string;
    author: {
      displayName: string;
      avatarUrl?: string;
    };
    createdAt: string;
  }>;
}

export function ArticlesLikedList({ articles }: ArticlesLikedListProps) {
  if (articles.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">Aucun article liké</h3>
          <p className="text-sm">
            Explorez les articles et utilisez le bouton "J'aime" pour les retrouver ici.
          </p>
          <Link
            href="/articles"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Explorer les articles
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {articles.map((article) => (
        <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
          <Link href={`/article/${article.id}`} className="flex gap-4">
            {article.coverUrl && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={article.coverUrl}
                  alt={article.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
            <div className="flex-grow">
              <h3 className="font-medium text-lg mb-2 line-clamp-2">{article.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  {article.author.avatarUrl ? (
                    <Image
                      src={article.author.avatarUrl}
                      alt={article.author.displayName}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                  )}
                  <span>{article.author.displayName}</span>
                </div>
                <span>•</span>
                <time dateTime={article.createdAt}>
                  {new Date(article.createdAt).toLocaleDateString()}
                </time>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
}