import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BookDetailPageClient from './BookDetailPageClient';

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

  return <BookDetailPageClient book={book} />;
}
