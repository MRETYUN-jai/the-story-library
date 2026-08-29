import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// 1. GET ALL BOOKS FOR ADMIN
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const books = await db.book.findMany({
    include: {
      series: true,
      chapters: {
        select: { id: true, title: true, chapterNumber: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ books });
}

// 2. CREATE NEW BOOK
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug,
      description,
      genre,
      coverImage,
      digitalPrice,
      paperbackEnabled,
      paperbackLink,
      paperbackPublisher,
      hardcoverEnabled,
      hardcoverLink,
      hardcoverPublisher,
      seriesId,
      bookNumber,
    } = body;

    if (!title || !slug || !description) {
      return NextResponse.json({ error: 'Title, slug, and description are required' }, { status: 400 });
    }

    const book = await db.book.create({
      data: {
        title,
        slug,
        description,
        genre: genre || 'Fiction',
        coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        digitalPrice: parseFloat(digitalPrice) || 199,
        paperbackEnabled: paperbackEnabled ?? true,
        paperbackLink: paperbackLink || null,
        paperbackPublisher: paperbackPublisher || 'Pothi Publishing (pothi.com)',
        hardcoverEnabled: hardcoverEnabled ?? true,
        hardcoverLink: hardcoverLink || null,
        hardcoverPublisher: hardcoverPublisher || 'Pothi Publishing (pothi.com)',
        seriesId: seriesId || null,
        bookNumber: bookNumber ? parseInt(bookNumber) : null,
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create book' }, { status: 500 });
  }
}

// 3. UPDATE EXISTING BOOK DETAILS & LINKS
export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const book = await db.book.update({
      where: { id },
      data: {
        ...updateData,
        digitalPrice: updateData.digitalPrice ? parseFloat(updateData.digitalPrice) : undefined,
      },
    });

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update book' }, { status: 500 });
  }
}

// 4. DELETE BOOK BY ID
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    await db.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete book' }, { status: 500 });
  }
}