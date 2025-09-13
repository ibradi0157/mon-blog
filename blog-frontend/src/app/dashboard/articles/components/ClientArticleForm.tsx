'use client';

import { ArticleForm } from './ArticleForm';
import { useRouter } from 'next/navigation';

export function ClientArticleForm() {
  const router = useRouter();
  return <ArticleForm onSuccess={() => router.push('/dashboard/articles')} />;
}
