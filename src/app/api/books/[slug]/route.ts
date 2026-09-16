import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const book = await db.book.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        genre: true,
        coverImage: true,
        digitalPrice: true,
        currency: true,
        digitalEnabled: true,
        paperbackEnabled: true,
        paperbackPublisher: true,
        paperbackLink: true,
        hardcoverEnabled: true,
        hardcoverPublisher: true,
        hardcoverLink: true,
        kindleEnabled: true,
        kindlePublisher: true,
        kindleLink: true,
        bookNumber: true,
        seriesId: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapters: {
          where: { published: true },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
          },
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Book detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch book detail' }, { status: 500 });
  }
}
