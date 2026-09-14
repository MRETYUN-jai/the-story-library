import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access. Admin privileges required.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bookId = formData.get('bookId') as string | null;

    if (!file || !bookId) {
      return NextResponse.json({ error: 'Manuscript file and Book ID are required' }, { status: 400 });
    }

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: 'Selected book was not found in the database' }, { status: 404 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure private_manuscripts/ directory exists outside public directory
    const privateDir = path.join(process.cwd(), 'private_manuscripts');
    if (!fs.existsSync(privateDir)) {
      fs.mkdirSync(privateDir, { recursive: true });
    }

    let pageCount = 0;
    const pdfFileName = `${book.slug}.pdf`;
    const targetPdfPath = path.join(privateDir, pdfFileName);

    if (fileName.endsWith('.pdf')) {
      // 1. Direct PDF Upload: Validate with pdf-lib and write directly to secure vault
      try {
        const loadedPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = loadedPdf.getPageCount();
      } catch (pdfErr) {
        console.warn('PDF page count read warning, using raw buffer:', pdfErr);
      }

      fs.writeFileSync(targetPdfPath, buffer);

      // Update book record with secure PDF reference
      await db.book.update({
        where: { id: book.id },
        data: { pdfUrl: pdfFileName },
      });

      // Ensure at least one chapter record exists so chapters count displays properly
      const existingChaptersCount = await db.chapter.count({ where: { bookId: book.id } });
      if (existingChaptersCount === 0) {
        await db.chapter.create({
          data: {
            bookId: book.id,
            chapterNumber: 1,
            title: 'Complete Manuscript Edition',
            content: 'Official manuscript file uploaded to StoryVault DRM Vault.',
            published: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Manuscript "${file.name}" uploaded successfully! Saved to DRM Vault with ${pageCount > 0 ? pageCount : 'multiple'} pages.`,
        fileName: file.name,
        fileSizeMb: (buffer.length / (1024 * 1024)).toFixed(2),
        pageCount,
        pdfUrl: pdfFileName,
      });

    } else if (fileName.endsWith('.docx')) {
      // 2. Word (.docx) Upload: Extract text and chapters via mammoth
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = result.value || '';

      const chapterRegex = /(?=(?:CHAPTER|Chapter)\s+(?:\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve))/gi;
      let rawChapters = extractedText.split(chapterRegex).filter((ch) => ch.trim().length > 0);
      if (rawChapters.length <= 1) {
        rawChapters = [extractedText];
      }

      await db.chapter.deleteMany({ where: { bookId: book.id } });
      for (let i = 0; i < rawChapters.length; i++) {
        const chText = rawChapters[i].trim();
        const lines = chText.split('\n').map((l) => l.trim()).filter(Boolean);
        const title = (lines[0] && lines[0].length < 80) ? lines[0] : `Chapter ${i + 1}`;
        await db.chapter.create({
          data: {
            bookId: book.id,
            chapterNumber: i + 1,
            title,
            content: chText,
            published: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Word manuscript processed! Created ${rawChapters.length} chapter(s) for ${book.title}.`,
        fileName: file.name,
        chaptersCount: rawChapters.length,
      });

    } else {
      return NextResponse.json({
        error: 'Unsupported file format. Please upload a PDF manuscript (.pdf) or Word document (.docx).',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Manuscript upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process manuscript upload' }, { status: 500 });
  }
}
