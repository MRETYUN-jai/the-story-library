import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const isSample = searchParams.get('sample') === 'true';

    const user = await getSessionUser();

    const book = await db.book.findUnique({
      where: { slug },
      include: {
        chapters: {
          where: { published: true },
          orderBy: { chapterNumber: 'asc' },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check authorization: User must have verified purchase, be admin, or be viewing sample mode preview
    if (!isSample) {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      if (user.role !== 'ADMIN') {
        const purchase = await db.purchase.findFirst({
          where: {
            userId: user.id,
            bookId: book.id,
            status: 'SUCCESS',
          },
        });

        if (!purchase) {
          return NextResponse.json({ error: 'Digital reading license required for this book.' }, { status: 403 });
        }
      }
    }

    // Determine target PDF file location
    let pdfFilePath = '';
    if (book.pdfUrl && fs.existsSync(path.join(process.cwd(), 'public', book.pdfUrl))) {
      pdfFilePath = path.join(process.cwd(), 'public', book.pdfUrl);
    } else {
      const manuscriptPath = path.join(process.cwd(), 'public', 'uploads', `${book.slug}.pdf`);
      if (fs.existsSync(manuscriptPath)) {
        pdfFilePath = manuscriptPath;
      }
    }

    let fileBuffer: Buffer;

    if (pdfFilePath && fs.existsSync(pdfFilePath)) {
      fileBuffer = fs.readFileSync(pdfFilePath);
    } else {
      // Dynamically generate exact PDF manuscript for newly created books!
      const pdfDoc = await PDFDocument.create();
      const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      const pageMargin = 50;
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Page 1: Title Page
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawText(book.title.toUpperCase(), {
        x: 160,
        y: 480,
        size: 22,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      page.drawText('by', {
        x: 285,
        y: 360,
        size: 14,
        font: timesItalic,
        color: rgb(0, 0, 0),
      });
      page.drawText('MRETYUN JAI B', {
        x: 215,
        y: 320,
        size: 18,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      page.drawText('1', { x: 292, y: 40, size: 10, font: timesFont });

      // Chapters
      let pageNum = 2;
      for (const ch of book.chapters) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawText(book.title.toUpperCase(), { x: 220, y: 780, size: 9, font: timesFont });
        page.drawText(`Chapter ${ch.chapterNumber}`, { x: pageMargin, y: 730, size: 14, font: timesItalic });
        page.drawText(ch.title, { x: pageMargin, y: 705, size: 16, font: timesBold });

        const lines = ch.content.split('\n').map((l) => l.trim()).filter(Boolean);
        let currentY = 660;

        for (const line of lines) {
          if (currentY < 80) break;
          page.drawText(line.slice(0, 80), { x: pageMargin, y: currentY, size: 11, font: timesFont });
          currentY -= 22;
        }

        page.drawText(String(pageNum++), { x: 292, y: 40, size: 10, font: timesFont });
      }

      const uint8Array = await pdfDoc.save();
      fileBuffer = Buffer.from(uint8Array);

      // Save to disk for future instant loading
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const savePath = path.join(uploadsDir, `${book.slug}.pdf`);
      fs.writeFileSync(savePath, fileBuffer);

      await db.book.update({
        where: { id: book.id },
        data: { pdfUrl: `/uploads/${book.slug}.pdf` },
      });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="manuscript.pdf"',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Stream PDF error:', error);
    return NextResponse.json({ error: 'Failed to stream manuscript PDF' }, { status: 500 });
  }
}
