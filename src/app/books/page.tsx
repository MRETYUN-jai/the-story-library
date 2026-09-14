import { db } from '@/lib/db';
import ExploreBooksClient from './ExploreBooksClient';

export default async function ExploreBooksPage() {
  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    include: { series: true },
    orderBy: [
      { seriesId: 'asc' },
      { bookNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return <ExploreBooksClient books={books} />;
}
