'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight, CheckCircle2, Award } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  bookNumber?: number | null;
  series?: { name: string } | null;
  digitalPrice: number;
  unlocked: boolean;
  progressPercent?: number;
  pageNumber?: number;
  bookmarkPage?: number | null;
  lastChapterTitle?: string;
}

interface BookshelfProps {
  unlockedBooks: BookItem[];
  lockedBooks?: BookItem[];
}

export default function Bookshelf({ unlockedBooks }: BookshelfProps) {
  if (unlockedBooks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30 shadow-md">
            <BookOpen className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-rose-100 font-bold tracking-wide">
              PURCHASED BOOKS
            </h2>
            <p className="text-xs text-slate-400">Your unlocked digital stories ready to read</p>
          </div>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/25 shadow-sm">
          {unlockedBooks.length} {unlockedBooks.length === 1 ? 'Book' : 'Books'} Available
        </span>
      </div>

      <div className="relative bg-gradient-to-b from-[#140C18]/45 to-[#0F0812]/50 border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-3xl overflow-hidden">
        
        {/* Shelf Overhead Atmospheric Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 bg-rose-500/10 blur-xl pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
          {unlockedBooks.map((book) => {
            const percent = Math.round(book.progressPercent || 0);
            const isFinished = percent >= 98;

            return (
              <div
                key={book.id}
                className="group bg-[#0E1422]/40 backdrop-blur-2xl border border-white/[0.12] rounded-2xl overflow-hidden hover:border-rose-500/60 hover:shadow-2xl hover:shadow-rose-500/20 transition-all duration-300 flex flex-col justify-between hover:bg-[#141C30]/50 hover:-translate-y-1"
              >
                <div>
                  {/* Cover Container */}
                  <Link href={`/read/${book.slug}`} className="block relative aspect-[2/3] overflow-hidden bg-[#05080E]/70 cursor-pointer">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1422]/80 via-transparent to-transparent opacity-60" />
                    
                    {/* Status Badge */}
                    {isFinished ? (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        COMPLETED
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-rose-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        UNLOCKED
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <Link href={`/read/${book.slug}`}>
                      <h3 className="font-serif text-base font-bold text-rose-100 line-clamp-1 group-hover:text-rose-300 transition-colors">
                        {book.title}
                      </h3>
                    </Link>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>
                          {book.bookmarkPage
                            ? `🔖 Page ${book.bookmarkPage}`
                            : book.pageNumber && book.pageNumber > 1
                            ? `Page ${book.pageNumber}`
                            : 'Progress'}
                        </span>
                        <span className="text-rose-300 font-bold font-mono">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#080C14]/60 rounded-full overflow-hidden border border-white/[0.08]">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300 transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RESUME READING Action Button */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/read/${book.slug}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {book.pageNumber && book.pageNumber > 1
                        ? `RESUME READING (P. ${book.pageNumber})`
                        : 'RESUME READING'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
