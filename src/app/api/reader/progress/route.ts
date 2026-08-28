import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { bookId, chapterId, positionPercent } = await request.json();

    if (!bookId || !chapterId) {
      return NextResponse.json({ error: 'Book ID and Chapter ID are required' }, { status: 400 });
    }

    const progress = await db.readingProgress.upsert({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId,
        },
      },
      update: {
        chapterId,
        positionPercent: Math.min(100, Math.max(0, positionPercent || 0)),
        lastReadAt: new Date(),
      },
      create: {
        userId: user.id,
        bookId,
        chapterId,
        positionPercent: Math.min(100, Math.max(0, positionPercent || 0)),
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
