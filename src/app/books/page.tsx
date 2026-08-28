import Link from 'next/link';
import { db } from '@/lib/db';
import { Compass, ArrowRight, Lock, BookOpen, Heart } from 'lucide-react';

export default async function ExploreBooksPage() {
  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    include: { series: true },
    orderBy: [
      { seriesId: 'asc' },
      { bookNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-4 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30">
            <Compass className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-rose-100 font-bold tracking-tight">
              EXPLORE THE LIBRARY
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Discover digital reading access and physical editions for all books by Mretyun Jai B
            </p>
          </div>
        </div>
      </div>

      {/* Book Catalog Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/60 rounded-2xl p-6 shadow-xl transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4 bg-[#05080E]">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#080C14]/90 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {book.genre}
                </div>
              </div>

              <div className="space-y-2">
                {book.series && (
                  <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest block">
                    {book.series.name} {book.bookNumber ? `• Book ${book.bookNumber}` : ''}
                  </span>
                )}
                <h2 className="font-serif text-xl font-bold text-rose-100 group-hover:text-rose-300 transition-colors">
                  {book.title}
                </h2>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {book.description}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#1C2638] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Digital Reading</span>
                <span className="font-serif text-lg font-bold text-rose-300">
                  ₹{book.digitalPrice}
                </span>
              </div>

              <Link
                href={`/books/${book.slug}`}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <span>VIEW BOOK & BUY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
