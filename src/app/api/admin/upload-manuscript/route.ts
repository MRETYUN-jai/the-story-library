import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bookId = formData.get('bookId') as string | null;

    if (!file || !bookId) {
      return NextResponse.json({ error: 'File and Book ID are required' }, { status: 400 });
    }

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse');
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || '';

        // Save PDF file to public/uploads/
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const pdfRelPath = `/uploads/${book.slug}.pdf`;
        const pdfFullPath = path.join(uploadsDir, `${book.slug}.pdf`);
        fs.writeFileSync(pdfFullPath, buffer);

        // Update book with pdfUrl
        await db.book.update({
          where: { id: book.id },
          data: { pdfUrl: pdfRelPath },
        });
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        return NextResponse.json({
          error: 'Failed to parse PDF text. Please upload a Word (.docx) manuscript or a plain text PDF.',
        }, { status: 400 });
      }
    } else if (fileName.endsWith('.txt')) {
      return NextResponse.json({ error: 'Unsupported file format. Please upload a .pdf, .docx, or .txt file.' }, { status: 400 });
    }

    // Strict validation: Reject if raw PDF binary headers exist in text
    if (
      !extractedText.trim() ||
      extractedText.includes('%PDF-') ||
      extractedText.includes('/StructTreeRoot') ||
      extractedText.includes('endobj')
    ) {
      return NextResponse.json({
        error: 'The uploaded file contains raw binary PDF stream objects and could not be extracted into readable text. Please upload your manuscript in Word (.docx) or Text (.txt) format.',
      }, { status: 400 });
    }

    // Clean up stray control characters
    extractedText = extractedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .trim();

    // Smart Chapter Splitting regex matching "Chapter 1", "CHAPTER I", "Chapter One", etc.
    const chapterRegex = /(?=(?:CHAPTER|Chapter)\s+(?:\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve))/gi;
    
    let rawChapters = extractedText.split(chapterRegex).filter((ch) => ch.trim().length > 0);

    if (rawChapters.length <= 1) {
      rawChapters = [extractedText];
    }

    // Delete existing chapters for this book before inserting updated manuscript
    await db.chapter.deleteMany({ where: { bookId } });

    const createdChapters = [];
    for (let i = 0; i < rawChapters.length; i++) {
      const chText = rawChapters[i].trim();
      const lines = chText.split('\n').map((l) => l.trim()).filter(Boolean);
      
      const firstLine = lines[0] || `Chapter ${i + 1}`;
      const title = firstLine.length < 80 ? firstLine : `Chapter ${i + 1}`;

      const chapter = await db.chapter.create({
        data: {
          bookId,
          chapterNumber: i + 1,
          title,
          content: chText,
          published: true,
        },
      });

      createdChapters.push({
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Manuscript uploaded & parsed successfully! Extracted ${createdChapters.length} clean chapter(s) for ${book.title}.`,
      chaptersCount: createdChapters.length,
      chapters: createdChapters,
    });
  } catch (error: any) {
    console.error('Manuscript upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process manuscript file' }, { status: 500 });
  }
}
