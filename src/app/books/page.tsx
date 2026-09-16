import { db } from '@/lib/db';
import ExploreBooksClient from './ExploreBooksClient';

export const revalidate = 60;

export default async function ExploreBooksPage() {
  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      genre: true,
      coverImage: true,
      digitalPrice: true,
      digitalEnabled: true,
      currency: true,
      paperbackEnabled: true,
      paperbackLink: true,
      hardcoverEnabled: true,
      hardcoverLink: true,
      kindleEnabled: true,
      kindleLink: true,
      seriesId: true,
      bookNumber: true,
      series: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { seriesId: 'asc' },
      { bookNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return <ExploreBooksClient books={books} />;
}
