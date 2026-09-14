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
      digitalEnabled,
      currency,
      paperbackEnabled,
      paperbackLink,
      paperbackPublisher,
      hardcoverEnabled,
      hardcoverLink,
      hardcoverPublisher,
      kindleEnabled,
      kindleLink,
      kindlePublisher,
      seriesId,
      bookNumber,
      status,
      pdfUrl,
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
        digitalEnabled: digitalEnabled ?? true,
        currency: currency || 'INR',
        paperbackEnabled: paperbackEnabled ?? true,
        paperbackLink: paperbackLink || null,
        paperbackPublisher: paperbackPublisher || 'Pothi Publishing (pothi.com)',
        hardcoverEnabled: hardcoverEnabled ?? true,
        hardcoverLink: hardcoverLink || null,
        hardcoverPublisher: hardcoverPublisher || 'Pothi Publishing (pothi.com)',
        kindleEnabled: kindleEnabled ?? true,
        kindleLink: kindleLink || null,
        kindlePublisher: kindlePublisher || 'Amazon Kindle',
        seriesId: seriesId || null,
        bookNumber: bookNumber ? parseInt(bookNumber) : null,
        status: status || 'PUBLISHED',
        pdfUrl: pdfUrl || null,
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
    const {
      id,
      title,
      slug,
      description,
      genre,
      coverImage,
      pdfUrl,
      status,
      digitalPrice,
      digitalEnabled,
      currency,
      paperbackEnabled,
      paperbackLink,
      paperbackPublisher,
      hardcoverEnabled,
      hardcoverLink,
      hardcoverPublisher,
      kindleEnabled,
      kindleLink,
      kindlePublisher,
      seriesId,
      bookNumber,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (genre !== undefined) updateData.genre = genre;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl || null;
    if (status !== undefined) updateData.status = status;
    if (digitalPrice !== undefined) updateData.digitalPrice = parseFloat(digitalPrice) || 0;
    if (digitalEnabled !== undefined) updateData.digitalEnabled = Boolean(digitalEnabled);
    if (currency !== undefined) updateData.currency = currency;
    if (paperbackEnabled !== undefined) updateData.paperbackEnabled = Boolean(paperbackEnabled);
    if (paperbackLink !== undefined) updateData.paperbackLink = paperbackLink || null;
    if (paperbackPublisher !== undefined) updateData.paperbackPublisher = paperbackPublisher || null;
    if (hardcoverEnabled !== undefined) updateData.hardcoverEnabled = Boolean(hardcoverEnabled);
    if (hardcoverLink !== undefined) updateData.hardcoverLink = hardcoverLink || null;
    if (hardcoverPublisher !== undefined) updateData.hardcoverPublisher = hardcoverPublisher || null;
    if (kindleEnabled !== undefined) updateData.kindleEnabled = Boolean(kindleEnabled);
    if (kindleLink !== undefined) updateData.kindleLink = kindleLink || null;
    if (kindlePublisher !== undefined) updateData.kindlePublisher = kindlePublisher || null;
    if (seriesId !== undefined) updateData.seriesId = seriesId || null;
    if (bookNumber !== undefined) updateData.bookNumber = bookNumber ? parseInt(bookNumber) : null;

    const book = await db.book.update({
      where: { id },
      data: updateData,
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
    return NextResponse.json({ error: 'Unauthorized. Only admin can delete books.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // Clean up dependent child records in a transaction to prevent foreign key constraint failures
    await db.$transaction([
      db.bookmark.deleteMany({ where: { bookId: id } }),
      db.readingProgress.deleteMany({ where: { bookId: id } }),
      db.purchase.deleteMany({ where: { bookId: id } }),
      db.chapter.deleteMany({ where: { bookId: id } }),
      db.coupon.updateMany({ where: { bookId: id }, data: { bookId: null } }),
      db.book.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete book' }, { status: 500 });
  }
}