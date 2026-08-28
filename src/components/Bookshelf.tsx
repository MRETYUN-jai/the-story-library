'use client';

import Link from 'next/link';
import { Lock, BookOpen, ArrowRight, Sparkles, CheckCircle, Heart } from 'lucide-react';

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
  lastChapterTitle?: string;
}

interface BookshelfProps {
  unlockedBooks: BookItem[];
  lockedBooks: BookItem[];
}

export default function Bookshelf({ unlockedBooks, lockedBooks }: BookshelfProps) {
  return (
    <div className="space-y-12 font-sans">
      
      {/* SECTION 1: MY PURCHASED BOOKS & CONTINUE READING */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30">
              <BookOpen className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-rose-100 font-bold tracking-wide">
                MY BOOKS
              </h2>
              <p className="text-xs text-slate-400">Unlocked stories waiting in your personal collection</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
            {unlockedBooks.length} Unlocked Access
          </span>
        </div>

        {unlockedBooks.length > 0 ? (
          <div className="relative bg-[#120B15]/90 border-t-8 border-[#381B28] rounded-b-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
            {/* Realistic Wooden Shelf Surface */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {unlockedBooks.map((book) => {
                const percent = Math.round(book.progressPercent || 0);
                return (
                  <div
                    key={book.id}
                    className="group bg-[#0E1422] border border-[#1E293E] rounded-xl overflow-hidden hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Book Cover Container */}
                      <div className="relative aspect-[2/3] overflow-hidden bg-[#05080E]">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1422] via-transparent to-transparent opacity-60" />
                        
                        {/* Unlocked Badge */}
                        <div className="absolute top-3 right-3 bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase shadow flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          UNLOCKED
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="p-4 space-y-2">
                        {book.series && (
                          <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest block">
                            {book.series.name} {book.bookNumber ? `• Book ${book.bookNumber}` : ''}
                          </span>
                        )}
                        <h3 className="font-serif text-base font-bold text-rose-100 line-clamp-1 group-hover:text-rose-300 transition-colors">
                          {book.title}
                        </h3>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Reading Progress</span>
                            <span className="text-rose-300 font-semibold">{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#080C14] rounded-full overflow-hidden border border-[#1A2336]">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-4 pt-0">
                      <Link
                        href={`/read/${book.slug}`}
                        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>{percent > 0 ? 'CONTINUE READING' : 'START READING'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Shelf Base Line */}
            <div className="h-4 bg-[#23121C] border-t border-[#3A1E2E] rounded-b-xl -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-8 flex items-center justify-center">
              <div className="w-1/3 h-1 bg-[#140B10]/60 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-8 text-center text-slate-400 space-y-3">
            <BookOpen className="w-10 h-10 text-rose-500/40 mx-auto" />
            <h3 className="font-serif text-lg text-rose-200">Your digital bookshelf is waiting</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t unlocked any digital books yet. Explore Mretyun Jai B&apos;s collection to start your reading journey.
            </p>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-all mt-2"
            >
              <span>EXPLORE THE LIBRARY</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* SECTION 2: NOT YET UNLOCKED BOOKS */}
      {lockedBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-slate-200 font-bold tracking-wide">
                  NOT YET UNLOCKED
                </h2>
                <p className="text-xs text-slate-400">Books available to unlock in your digital library</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {lockedBooks.map((book) => (
              <div
                key={book.id}
                className="group bg-[#0E1422]/70 border border-[#1E293E] rounded-xl overflow-hidden hover:border-rose-500/40 transition-all flex flex-col justify-between opacity-90 hover:opacity-100"
              >
                <div>
                  {/* Cover with Lock Overlay */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#05080E]">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-black/70 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-2 shadow-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-rose-200">🔒 LOCKED</span>
                      <span className="text-[10px] text-slate-300 mt-1 font-semibold">
                        Digital Access: ₹{book.digitalPrice}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-1">
                    {book.series && (
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                        {book.series.name}
                      </span>
                    )}
                    <h3 className="font-serif text-base font-bold text-slate-300 line-clamp-1">
                      {book.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    href={`/books/${book.slug}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>VIEW BOOK & UNLOCK</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
