import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import MyLibraryClient from './MyLibraryClient';

export default async function MyLibraryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login?redirect=/library');
  }

  // Fetch purchases
  const purchases = await db.purchase.findMany({
    where: {
      userId: user.id,
      status: 'SUCCESS',
    },
    include: {
      book: {
        include: { series: true },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  const purchasedBookIds = purchases.map((p) => p.bookId);

  // Fetch all books
  const allBooks = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    include: { series: true },
    orderBy: [
      { seriesId: 'asc' },
      { bookNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  // Fetch reading progress
  const progressList = await db.readingProgress.findMany({
    where: { userId: user.id },
    include: { chapter: true },
  });

  const progressMap = new Map();
  for (const prog of progressList) {
    progressMap.set(prog.bookId, {
      positionPercent: prog.positionPercent,
      lastChapterTitle: prog.chapter?.title,
      lastReadAt: prog.lastReadAt,
    });
  }

  const unlockedBooks = allBooks
    .filter((b) => purchasedBookIds.includes(b.id) || user.role === 'ADMIN')
    .map((b) => {
      const prog = progressMap.get(b.id);
      return {
        ...b,
        unlocked: true,
        progressPercent: prog?.positionPercent || 0,
        lastChapterTitle: prog?.lastChapterTitle || 'Chapter 1',
      };
    });

  const lockedBooks = allBooks
    .filter((b) => !purchasedBookIds.includes(b.id) && user.role !== 'ADMIN')
    .map((b) => ({
      ...b,
      unlocked: false,
    }));

  // Determine last read book
  let lastReadBook = undefined;
  if (unlockedBooks.length > 0) {
    const sortedByLastRead = [...unlockedBooks].sort((a, b) => {
      const timeA = progressMap.get(a.id)?.lastReadAt?.getTime() || 0;
      const timeB = progressMap.get(b.id)?.lastReadAt?.getTime() || 0;
      return timeB - timeA;
    });
    lastReadBook = sortedByLastRead[0];
  }

  return (
    <MyLibraryClient
      user={user}
      unlockedBooks={unlockedBooks}
      lockedBooks={lockedBooks}
      lastReadBook={lastReadBook}
      purchases={purchases}
    />
  );
}
