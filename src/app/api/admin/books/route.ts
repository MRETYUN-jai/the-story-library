import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const books = await db.book.findMany({
      include: {
        series: true,
        chapters: {
          select: { id: true, chapterNumber: true, title: true, published: true },
          orderBy: { chapterNumber: 'asc' },
        },
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const seriesList = await db.series.findMany();

    return NextResponse.json({ books, seriesList });
  } catch (error) {
    console.error('Admin books list error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin books' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      bookNumber,
      seriesId,
      description,
      genre,
      coverImage,
      digitalPrice,
      digitalEnabled,
      paperbackEnabled,
      paperbackLink,
      paperbackPublisher,
      hardcoverEnabled,
      hardcoverLink,
      hardcoverPublisher,
      kindleEnabled,
      kindleLink,
      kindlePublisher,
    } = body;

    if (!title || !slug || !description || !genre || !coverImage) {
      return NextResponse.json({ error: 'Title, slug, description, genre, and cover image are required' }, { status: 400 });
    }

    const existing = await db.book.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A book with this URL slug already exists' }, { status: 409 });
    }

    const book = await db.book.create({
      data: {
        title,
        slug: slug.toLowerCase().trim(),
        bookNumber: bookNumber ? parseInt(bookNumber) : null,
        seriesId: seriesId || null,
        description,
        genre,
        coverImage,
        digitalPrice: parseFloat(digitalPrice) || 199,
        digitalEnabled: Boolean(digitalEnabled),
        paperbackEnabled: Boolean(paperbackEnabled),
        paperbackLink,
        paperbackPublisher: paperbackPublisher || 'Pothi Publishing',
        hardcoverEnabled: Boolean(hardcoverEnabled),
        hardcoverLink,
        hardcoverPublisher: hardcoverPublisher || 'Amazon Hardcover',
        kindleEnabled: Boolean(kindleEnabled),
        kindleLink,
        kindlePublisher: kindlePublisher || 'Amazon Kindle',
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error('Admin add book error:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const book = await db.book.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        genre: data.genre,
        coverImage: data.coverImage,
        digitalPrice: parseFloat(data.digitalPrice) || 0,
        digitalEnabled: Boolean(data.digitalEnabled),
        paperbackEnabled: Boolean(data.paperbackEnabled),
        paperbackLink: data.paperbackLink,
        paperbackPublisher: data.paperbackPublisher,
        hardcoverEnabled: Boolean(data.hardcoverEnabled),
        hardcoverLink: data.hardcoverLink,
        hardcoverPublisher: data.hardcoverPublisher,
        kindleEnabled: Boolean(data.kindleEnabled),
        kindleLink: data.kindleLink,
        kindlePublisher: data.kindlePublisher,
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error('Admin update book error:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}
