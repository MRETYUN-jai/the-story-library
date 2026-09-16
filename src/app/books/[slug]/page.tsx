import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import BookDetailPageClient from './BookDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await db.book.findUnique({
    where: { slug },
    include: {
      series: true,
      chapters: {
        where: { published: true },
        select: { id: true, chapterNumber: true, title: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center text-xs text-rose-300 font-serif">
        Loading story details...
      </div>
    }>
      <BookDetailPageClient book={book} />
    </Suspense>
  );
}
