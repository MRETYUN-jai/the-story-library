import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, chapterId, pageNumber, positionPercent } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Resolve valid chapter if provided and exists
    let validChapterId: string | null = null;
    if (chapterId && chapterId !== 'manuscript_page') {
      const ch = await db.chapter.findUnique({ where: { id: chapterId } });
      if (ch) validChapterId = ch.id;
    }
    if (!validChapterId) {
      const firstChapter = await db.chapter.findFirst({
        where: { bookId, published: true },
        orderBy: { chapterNumber: 'asc' },
      });
      if (firstChapter) validChapterId = firstChapter.id;
    }

    const progress = await db.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      update: {
        chapterId: validChapterId,
        pageNumber: pageNumber || 1,
        positionPercent: Math.min(100, Math.max(0, positionPercent || 0)),
        lastReadAt: new Date(),
      },
      create: {
        userId: user.id,
        bookId,
        chapterId: validChapterId,
        pageNumber: pageNumber || 1,
        positionPercent: Math.min(100, Math.max(0, positionPercent || 0)),
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save progress' }, { status: 500 });
  }
}
