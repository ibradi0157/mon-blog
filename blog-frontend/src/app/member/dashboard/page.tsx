"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArticlesLikedList } from "../components/ArticlesLikedList";
import { FollowedAuthorsList } from "../components/FollowedAuthorsList";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/app/lib/api";
import { Loader2 } from "lucide-react";

export default function UserDashboardPage() {
  const { data: likedArticles, isLoading: loadingArticles } = useQuery({
    queryKey: ["likedArticles"],
    queryFn: () => api.get("/user-preferences/liked-articles").then((res) => res.data.data),
  });

  const { data: followedAuthors, isLoading: loadingAuthors } = useQuery({
    queryKey: ["followedAuthors"],
    queryFn: () => api.get("/user-preferences/followed-authors").then((res) => res.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold mb-2">Mon tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Retrouvez vos articles favoris et les auteurs que vous suivez.
        </p>
      </header>

      <Tabs defaultValue="liked">
        <TabsList className="mb-4">
          <TabsTrigger value="liked">Articles likés</TabsTrigger>
          <TabsTrigger value="authors">Auteurs suivis</TabsTrigger>
        </TabsList>

        <TabsContent value="liked">
          {loadingArticles ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <ArticlesLikedList articles={likedArticles || []} />
          )}
        </TabsContent>

        <TabsContent value="authors">
          {loadingAuthors ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <FollowedAuthorsList authors={followedAuthors || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}