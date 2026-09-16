import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import WebReader from '@/components/Reader/WebReader';
import { Lock, BookOpen, Compass, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReadBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sample?: string }>;
}) {
  const user = await getSessionUser();
  const { slug } = await params;
  const { sample } = await searchParams;
  const isSampleMode = sample === 'true';

  const book = await db.book.findUnique({
    where: { slug },
    include: {
      chapters: {
        where: { published: true },
        select: { id: true, chapterNumber: true, title: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-[#0E1422] p-8 rounded-3xl border border-[#1E293E] shadow-2xl">
          <h2 className="font-serif text-2xl font-bold text-rose-200">Story Not Found</h2>
          <p className="text-xs text-slate-400">The requested manuscript does not exist in our digital library.</p>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>EXPLORE THE STORIES</span>
          </Link>
        </div>
      </div>
    );
  }

  // Authorization check
  let isAuthorized = user?.role === 'ADMIN';

  if (!isAuthorized && user) {
    const purchase = await db.purchase.findFirst({
      where: {
        userId: user.id,
        bookId: book.id,
        status: 'SUCCESS',
      },
    });

    if (purchase) {
      isAuthorized = true;
    }
  }

  // If not authorized and NOT sample mode -> Show ACCESS DENIED screen
  if (!isAuthorized && !isSampleMode) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#0E1422] border-2 border-rose-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              LOCKED DIGITAL MANUSCRIPT
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100">
              {book.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              This book is locked in your account. Purchase digital access to unlock the full manuscript online.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href={`/read/${book.slug}?sample=true`}
              className="w-full py-3 px-6 rounded-xl bg-[#141C2E] border border-[#27364F] hover:border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span>READ FREE SAMPLE FIRST (1ST CHAPTER)</span>
            </Link>

            <Link
              href={`/books/${book.slug}`}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-xs shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>BUY & UNLOCK FULL ACCESS (₹{book.digitalPrice})</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter chapters if in sample mode (only chapter 1 / first chapter)
  const chaptersToDeliver = isSampleMode && !isAuthorized
    ? book.chapters.slice(0, 1)
    : book.chapters;

  // Get reading progress position if user exists
  let progress = null;
  if (user) {
    progress = await db.readingProgress.findUnique({
      where: {
        userId_bookId: {
          userId: user.id,
          bookId: book.id,
        },
      },
    });
  }

  const watermark = user
    ? `LICENSED TO: ${user.email} • ${user.name} • UID: ${user.id.slice(0, 8)}`
    : `STORYVAULT SAMPLE PREVIEW • PROTECTED MANUSCRIPT`;

  return (
    <WebReader
      book={{
        id: book.id,
        title: book.title,
        slug: book.slug,
        digitalPrice: book.digitalPrice,
        currency: book.currency,
        coverImage: book.coverImage,
      }}
      chapters={chaptersToDeliver}
      watermark={watermark}
      initialProgress={progress}
      isSampleMode={isSampleMode && !isAuthorized}
      totalBookChapters={book.chapters.length}
    />
  );
}
