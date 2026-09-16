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
      select: {
        id: true,
        title: true,
        slug: true,
        pdfUrl: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 🛡️ ANTI-HACKER & BOT DEFENSE:
    // 1. Validate Referer / Host to prevent hotlinking, external bots, or unauthorized scraping
    const referer = request.headers.get('referer');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const secFetchDest = request.headers.get('sec-fetch-dest');

    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        const hostWithoutPort = host.split(':')[0];
        const refererHostWithoutPort = refererUrl.hostname;
        if (
          refererHostWithoutPort !== hostWithoutPort &&
          !refererHostWithoutPort.endsWith('.vercel.app') &&
          !hostWithoutPort.endsWith('.vercel.app')
        ) {
          return NextResponse.json(
            { error: 'Direct cross-origin hotlinking is strictly prohibited by StoryVault DRM shield.' },
            { status: 403 }
          );
        }
      } catch {
        // Ignore parsing issues
      }
    }

    // Direct address bar navigation / download without authentication is blocked
    if (secFetchDest === 'document' && !user && !isSample) {
      return NextResponse.json(
        { error: 'Direct file download prohibited. Access is restricted to the secure in-memory Canvas Reader.' },
        { status: 403 }
      );
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

    let fileBuffer: Buffer | null = null;

    // 1. Check if PDF is stored directly in PostgreSQL database as base64
    if (book.pdfUrl && book.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = book.pdfUrl.slice('data:application/pdf;base64,'.length);
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // 2. Check local or temporary serverless disk cache
      const localFile = path.join(process.cwd(), 'private_manuscripts', `${book.slug}.pdf`);
      const tmpFile = path.join('/tmp', 'private_manuscripts', `${book.slug}.pdf`);

      try {
        if (fs.existsSync(localFile)) {
          fileBuffer = fs.readFileSync(localFile);
        } else if (fs.existsSync(tmpFile)) {
          fileBuffer = fs.readFileSync(tmpFile);
        }
      } catch {}
    }

    if (!fileBuffer) {
      // 3. Dynamically generate exact PDF manuscript if file doesn't exist yet
      const fullBook = await db.book.findUnique({
        where: { slug },
        select: {
          chapters: {
            where: { published: true },
            orderBy: { chapterNumber: 'asc' },
            select: { chapterNumber: true, title: true, content: true },
          },
        },
      });
      const chapters = fullBook?.chapters || [];

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
      for (const ch of chapters) {
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

      // Try caching to /tmp where possible
      try {
        const tmpDir = path.join('/tmp', 'private_manuscripts');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        fs.writeFileSync(path.join(tmpDir, `${book.slug}.pdf`), fileBuffer);
      } catch {}
    }

    // 🛡️ CRITICAL SECURITY ENFORCEMENT: PHYSICAL SAMPLE TRUNCATION
    // When sample preview mode is requested, NEVER send the full PDF buffer.
    // Physically slice the PDF document to ONLY the first 3 pages.
    if (isSample) {
      const sourceDoc = await PDFDocument.load(fileBuffer);
      const totalPages = sourceDoc.getPageCount();
      const samplePageCount = Math.min(12, totalPages);

      const sampleDoc = await PDFDocument.create();
      const copiedPages = await sampleDoc.copyPages(
        sourceDoc,
        Array.from({ length: samplePageCount }, (_, i) => i)
      );

      for (const p of copiedPages) {
        sampleDoc.addPage(p);
      }

      const sampleBytes = await sampleDoc.save();
      fileBuffer = Buffer.from(sampleBytes);
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="storyvault_secure_stream.pdf"',
        'Cache-Control': 'private, max-age=1800, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none',
      },
    });
  } catch (error) {
    console.error('Stream PDF error:', error);
    return NextResponse.json({ error: 'Failed to stream manuscript PDF' }, { status: 500 });
  }
}

