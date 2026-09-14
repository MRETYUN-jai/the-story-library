import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ bookmark: null });

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    if (!bookId) return NextResponse.json({ bookmark: null });

    const bookmark = await db.bookmark.findFirst({
      where: { userId: user.id, bookId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmark });
  } catch (err) {
    return NextResponse.json({ bookmark: null });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, pageNumber, positionPercent } = await request.json();
    if (!bookId || !pageNumber) {
      return NextResponse.json({ error: 'Book ID and Page Number required' }, { status: 400 });
    }

    // Delete existing bookmark for this user & book
    await db.bookmark.deleteMany({
      where: { userId: user.id, bookId },
    });

    const bookmark = await db.bookmark.create({
      data: {
        userId: user.id,
        bookId,
        pageNumber,
        positionPercent: positionPercent || 0,
      },
    });

    // Also update ReadingProgress
    await db.readingProgress.upsert({
      where: { userId_bookId: { userId: user.id, bookId } },
      update: {
        pageNumber,
        positionPercent: positionPercent || 0,
        lastReadAt: new Date(),
      },
      create: {
        userId: user.id,
        bookId,
        pageNumber,
        positionPercent: positionPercent || 0,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (err: any) {
    console.error('Save bookmark error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save bookmark' }, { status: 500 });
  }
}
