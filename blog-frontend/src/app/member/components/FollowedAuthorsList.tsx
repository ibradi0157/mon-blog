import { Card } from "@/app/components/ui/Card";
import { UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FollowedAuthorsListProps {
  authors: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    articlesCount: number;
    followersCount: number;
  }>;
}

export function FollowedAuthorsList({ authors }: FollowedAuthorsListProps) {
  if (authors.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">Aucun auteur suivi</h3>
          <p className="text-sm">
            Suivez vos auteurs préférés pour être notifié de leurs nouvelles publications.
          </p>
          <Link
            href="/articles"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Découvrir des auteurs
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {authors.map((author) => (
        <Card key={author.id} className="p-4">
          <div className="flex items-center gap-4">
            {author.avatarUrl ? (
              <Image
                src={author.avatarUrl}
                alt={author.displayName}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-grow">
              <Link href={`/author/${author.id}`}>
                <h3 className="font-medium text-lg hover:text-blue-600 transition-colors">
                  {author.displayName}
                </h3>
              </Link>
              {author.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                  {author.bio}
                </p>
              )}
              <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{author.articlesCount} articles</span>
                <span>{author.followersCount} abonnés</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}