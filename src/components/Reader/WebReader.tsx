'use client';

import PdfCanvasReader from './PdfCanvasReader';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
}

interface WebReaderProps {
  book: {
    id: string;
    title: string;
    slug: string;
    pdfUrl?: string | null;
    digitalPrice?: number;
    currency?: string;
    coverImage?: string;
  };
  chapters: Chapter[];
  watermark: string;
  initialProgress?: {
    chapterId?: string | null;
    pageNumber?: number | null;
    positionPercent: number;
  } | null;
  isSampleMode?: boolean;
  totalBookChapters?: number;
}

export default function WebReader({
  book,
  watermark,
  initialProgress,
  isSampleMode = false,
}: WebReaderProps) {
  return (
    <PdfCanvasReader
      book={book}
      watermark={watermark}
      initialProgress={initialProgress}
      isSampleMode={isSampleMode}
    />
  );
}
