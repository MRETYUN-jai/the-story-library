'use client';

import PdfCanvasReader from './PdfCanvasReader';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
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
  watermark?: string;
  initialProgress?: {
    chapterId?: string | null;
    pageNumber?: number | null;
    positionPercent: number;
  } | null;
  initialBookmarks?: Array<{
    id?: string;
    pageNumber: number;
    positionPercent?: number;
    createdAt?: string;
  }>;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isSampleMode?: boolean;
  totalBookChapters?: number;
}

export default function WebReader({
  book,
  watermark,
  initialProgress,
  initialBookmarks = [],
  user = null,
  isSampleMode = false,
}: WebReaderProps) {
  return (
    <PdfCanvasReader
      book={book}
      watermark={watermark}
      initialProgress={initialProgress}
      initialBookmarks={initialBookmarks}
      user={user}
      isSampleMode={isSampleMode}
    />
  );
}
