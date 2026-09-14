import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import MyLibraryClient from './MyLibraryClient';

export default async function MyLibraryPage() {
  const user = await getSessionUser();

  // If user is not logged in, render the library with empty purchased books list
  if (!user) {
    return (
      <MyLibraryClient
        user={null}
        unlockedBooks={[]}
        lockedBooks={[]}
        lastReadBook={null}
        purchases={[]}
      />
    );
  }

  // Fetch purchases, published books, reading progress, and bookmarks in parallel
  const [purchases, allBooks, progressList, bookmarks] = await Promise.all([
    db.purchase.findMany({
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
    }),
    db.book.findMany({
      where: { status: 'PUBLISHED' },
      include: { series: true },
      orderBy: [
        { seriesId: 'asc' },
        { bookNumber: 'asc' },
        { createdAt: 'desc' },
      ],
    }),
    db.readingProgress.findMany({
      where: { userId: user.id },
      include: { chapter: true },
    }),
    db.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const purchasedBookIds = purchases.map((p) => p.bookId);

  const bookmarkMap = new Map();
  for (const bm of bookmarks) {
    if (!bookmarkMap.has(bm.bookId)) {
      bookmarkMap.set(bm.bookId, bm.pageNumber);
    }
  }

  const progressMap = new Map();
  for (const prog of progressList) {
    progressMap.set(prog.bookId, {
      positionPercent: prog.positionPercent,
      pageNumber: prog.pageNumber || 1,
      lastChapterTitle: prog.chapter?.title,
      lastReadAt: prog.lastReadAt,
    });
  }

  const unlockedBooks = allBooks
    .filter((b) => purchasedBookIds.includes(b.id) || user.role === 'ADMIN')
    .map((b) => {
      const prog = progressMap.get(b.id);
      const bmPage = bookmarkMap.get(b.id);
      const pageNumber = bmPage || prog?.pageNumber || 1;
      let progressPercent = prog?.positionPercent || 0;
      if (progressPercent === 0 && pageNumber > 1) {
        progressPercent = Math.min(100, Math.max(1, Math.round((pageNumber / 193) * 100)));
      }
      return {
        ...b,
        unlocked: true,
        progressPercent,
        pageNumber,
        bookmarkPage: bmPage || null,
        lastChapterTitle: prog?.lastChapterTitle || 'Chapter 1',
      };
    });

  // Determine last read book
  let lastReadBook = undefined;
  if (unlockedBooks.length > 0) {
    const booksWithActiveProgress = unlockedBooks.filter(
      (b) =>
        (progressMap.get(b.id)?.lastReadAt?.getTime() || 0) > 0 ||
        (b.pageNumber && b.pageNumber > 1) ||
        (b.bookmarkPage && b.bookmarkPage > 1)
    );

    if (booksWithActiveProgress.length > 0) {
      booksWithActiveProgress.sort((a, b) => {
        const timeA = progressMap.get(a.id)?.lastReadAt?.getTime() || 0;
        const timeB = progressMap.get(b.id)?.lastReadAt?.getTime() || 0;
        return timeB - timeA;
      });
      lastReadBook = booksWithActiveProgress[0];
    } else {
      lastReadBook = unlockedBooks[0];
    }
  }

  return (
    <MyLibraryClient
      user={user}
      unlockedBooks={unlockedBooks}
      lockedBooks={[]}
      lastReadBook={lastReadBook}
      purchases={purchases}
    />
  );
}
