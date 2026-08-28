import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { bookId, chapterNumber, title, content, published } = await request.json();

    if (!bookId || !chapterNumber || !title || !content) {
      return NextResponse.json({ error: 'Book ID, chapter number, title, and content are required' }, { status: 400 });
    }

    const chapter = await db.chapter.create({
      data: {
        bookId,
        chapterNumber: parseInt(chapterNumber),
        title,
        content,
        published: published ?? true,
      },
    });

    return NextResponse.json({ success: true, chapter });
  } catch (error) {
    console.error('Admin create chapter error:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, title, content, chapterNumber, published } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const chapter = await db.chapter.update({
      where: { id },
      data: {
        title,
        content,
        chapterNumber: chapterNumber ? parseInt(chapterNumber) : undefined,
        published,
      },
    });

    return NextResponse.json({ success: true, chapter });
  } catch (error) {
    console.error('Admin update chapter error:', error);
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
  }
}
