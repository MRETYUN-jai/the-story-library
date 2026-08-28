import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({
        authorized: false,
        error: 'Authentication required. Please log in to read this book.',
      }, { status: 401 });
    }

    const { slug } = await params;

    const book = await db.book.findUnique({
      where: { slug },
      include: {
        series: true,
        chapters: {
          where: { published: true },
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Authorization check: User must be ADMIN or have a verified SUCCESS purchase
    let hasAccess = user.role === 'ADMIN';

    if (!hasAccess) {
      const purchase = await db.purchase.findFirst({
        where: {
          userId: user.id,
          bookId: book.id,
          status: 'SUCCESS',
        },
      });

      if (purchase) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({
        authorized: false,
        error: 'ACCESS DENIED. You have not unlocked digital reading access for this book.',
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          coverImage: book.coverImage,
          digitalPrice: book.digitalPrice,
        },
      }, { status: 403 });
    }

    // Get current reading progress
    const progress = await db.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });

    const watermark = `Licensed to: ${user.name} • ${user.email}`;

    return NextResponse.json({
      authorized: true,
      book,
      progress,
      watermark,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Reader content API error:', error);
    return NextResponse.json({ error: 'Failed to load reading content' }, { status: 500 });
  }
}
