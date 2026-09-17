import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ bookmarks: [], bookmark: null });

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    if (!bookId) return NextResponse.json({ bookmarks: [], bookmark: null });

    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.id, bookId },
      orderBy: { pageNumber: 'asc' },
    });

    const latestBookmark = bookmarks.length > 0 ? bookmarks[bookmarks.length - 1] : null;

    return NextResponse.json({ bookmarks, bookmark: latestBookmark });
  } catch (err) {
    return NextResponse.json({ bookmarks: [], bookmark: null });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, pageNumber, positionPercent, action } = await request.json();
    if (!bookId || !pageNumber) {
      return NextResponse.json({ error: 'Book ID and Page Number required' }, { status: 400 });
    }

    // Check if bookmark on this page already exists
    const existing = await db.bookmark.findFirst({
      where: { userId: user.id, bookId, pageNumber },
    });

    if (action === 'remove' || (action === 'toggle' && existing)) {
      if (existing) {
        await db.bookmark.delete({
          where: { id: existing.id },
        });
      }
      
      const allBookmarks = await db.bookmark.findMany({
        where: { userId: user.id, bookId },
        orderBy: { pageNumber: 'asc' },
      });

      return NextResponse.json({ success: true, removed: true, bookmarks: allBookmarks });
    }

    let bookmark = existing;
    if (!bookmark) {
      bookmark = await db.bookmark.create({
        data: {
          userId: user.id,
          bookId,
          pageNumber,
          positionPercent: positionPercent || 0,
        },
      });
    }

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

    const allBookmarks = await db.bookmark.findMany({
      where: { userId: user.id, bookId },
      orderBy: { pageNumber: 'asc' },
    });

    return NextResponse.json({ success: true, bookmark, bookmarks: allBookmarks });
  } catch (err: any) {
    console.error('Save bookmark error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save bookmark' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const pageNumber = searchParams.get('pageNumber');
    const bookmarkId = searchParams.get('bookmarkId');

    if (bookmarkId) {
      await db.bookmark.deleteMany({
        where: { id: bookmarkId, userId: user.id },
      });
    } else if (bookId && pageNumber) {
      await db.bookmark.deleteMany({
        where: { userId: user.id, bookId, pageNumber: parseInt(pageNumber, 10) },
      });
    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const allBookmarks = bookId ? await db.bookmark.findMany({
      where: { userId: user.id, bookId },
      orderBy: { pageNumber: 'asc' },
    }) : [];

    return NextResponse.json({ success: true, bookmarks: allBookmarks });
  } catch (err: any) {
    console.error('Delete bookmark error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete bookmark' }, { status: 500 });
  }
}
