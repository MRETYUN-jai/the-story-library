import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import WebReader from '@/components/Reader/WebReader';
import { Lock, BookOpen, Compass } from 'lucide-react';

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
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-[#121826] p-8 rounded-3xl border border-[#232F47]">
          <h2 className="font-serif text-2xl font-bold text-amber-200">Book Not Found</h2>
          <p className="text-xs text-slate-400">The requested story does not exist in our library.</p>
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            EXPLORE BOOKS
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
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121826] border-2 border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
              ACCESS DENIED
            </span>
            <h2 className="font-serif text-2xl font-bold text-amber-100">
              {book.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              This book is not available in your library. Please purchase digital reading access to unlock.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href={`/read/${book.slug}?sample=true`}
              className="w-full py-3 px-6 rounded-xl bg-[#182236] border border-[#2E3C54] text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#1F2B42]"
            >
              <BookOpen className="w-4 h-4" />
              <span>READ FREE SAMPLE FIRST</span>
            </Link>

            <Link
              href={`/books/${book.slug}`}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2D] text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
            >
              <Lock className="w-4 h-4" />
              <span>BUY & UNLOCK FULL DIGITAL ACCESS (₹{book.digitalPrice})</span>
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
    ? `Licensed to: ${user.name} • ${user.email}`
    : `The Story Library • Free Sample Preview`;

  return (
    <WebReader
      book={{
        id: book.id,
        title: book.title,
        slug: book.slug,
        digitalPrice: book.digitalPrice,
      }}
      chapters={chaptersToDeliver}
      watermark={watermark}
      initialProgress={progress}
      isSampleMode={isSampleMode && !isAuthorized}
      totalBookChapters={book.chapters.length}
    />
  );
}
