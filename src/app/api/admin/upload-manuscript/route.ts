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

    const chunkIndexStr = formData.get('chunkIndex') as string | null;
    const totalChunksStr = formData.get('totalChunks') as string | null;
    const uploadId = (formData.get('uploadId') as string | null) || 'upload_session';
    const customFileName = (formData.get('fileName') as string | null) || file.name;

    const chunkIndex = chunkIndexStr !== null ? parseInt(chunkIndexStr, 10) : 0;
    const totalChunks = totalChunksStr !== null ? parseInt(totalChunksStr, 10) : 1;

    const arrayBuffer = await file.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    let buffer: Buffer;

    if (totalChunks > 1) {
      // Store individual chunk in /tmp directory
      const chunkFilePath = path.join('/tmp', `chunk_${uploadId}_${chunkIndex}.part`);
      try {
        fs.writeFileSync(chunkFilePath, chunkBuffer);
      } catch (err) {
        console.error('Failed to write upload chunk:', err);
      }

      // If not the final chunk, return chunk acknowledgement
      if (chunkIndex + 1 < totalChunks) {
        return NextResponse.json({
          success: true,
          chunkReceived: chunkIndex + 1,
          totalChunks,
          progressPercent: Math.round(((chunkIndex + 1) / totalChunks) * 100),
        });
      }

      // Final chunk reached: Stitch all chunks together into full manuscript buffer
      const chunkBuffers: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join('/tmp', `chunk_${uploadId}_${i}.part`);
        if (i === chunkIndex) {
          chunkBuffers.push(chunkBuffer);
        } else if (fs.existsSync(partPath)) {
          chunkBuffers.push(fs.readFileSync(partPath));
          try {
            fs.unlinkSync(partPath); // Clean up temp chunk
          } catch {}
        }
      }
      buffer = Buffer.concat(chunkBuffers);
    } else {
      buffer = chunkBuffer;
    }

    const fileName = customFileName.toLowerCase();

    // In serverless environments (Vercel), local filesystem is read-only except /tmp
    const tmpDir = path.join('/tmp', 'private_manuscripts');
    const localDir = path.join(process.cwd(), 'private_manuscripts');

    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}

    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
    } catch {}

    let pageCount = 0;
    const pdfFileName = `${book.slug}.pdf`;

    if (fileName.endsWith('.pdf')) {
      // 1. Direct PDF Upload: Validate with pdf-lib and write directly to secure vault
      try {
        const loadedPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = loadedPdf.getPageCount();
      } catch (pdfErr) {
        console.warn('PDF page count read warning, using raw buffer:', pdfErr);
      }

      // Try caching to filesystem where permitted
      try {
        fs.writeFileSync(path.join(tmpDir, pdfFileName), buffer);
      } catch {}
      try {
        fs.writeFileSync(path.join(localDir, pdfFileName), buffer);
      } catch {}

      // Store persistent Base64 PDF in PostgreSQL so it is accessible across all Vercel serverless instances
      const base64Pdf = `data:application/pdf;base64,${buffer.toString('base64')}`;

      // Update book record with secure persistent PDF
      await db.book.update({
        where: { id: book.id },
        data: { pdfUrl: base64Pdf },
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
