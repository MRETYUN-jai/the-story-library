'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Compass, Search, X } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string;
  coverImage: string;
  digitalPrice: number;
  series?: { name: string } | null;
  bookNumber?: number | null;
}

interface ExploreBooksClientProps {
  books: BookItem[];
}

export default function ExploreBooksClient({ books }: ExploreBooksClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('ALL');

  // Extract unique book titles for direct quick-filtering by name
  const bookTitles = useMemo(() => {
    return ['ALL', ...books.map((b) => b.title)];
  }, [books]);

  // Filter books strictly by Book Name (Title)
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        book.title.toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesSelectedTitle =
        selectedTitle === 'ALL' ||
        book.title.toLowerCase() === selectedTitle.toLowerCase();

      return matchesSearch && matchesSelectedTitle;
    });
  }, [books, searchQuery, selectedTitle]);

  const handleTitleSelect = (title: string) => {
    setSelectedTitle(title);
    if (title !== 'ALL') {
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER & BOOK NAME SEARCH BAR */}
        <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.05] to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 backdrop-blur-xl flex items-center justify-center text-rose-300 border border-rose-500/30 shadow-lg shadow-rose-500/10">
                <Compass className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-4xl text-rose-100 font-bold tracking-tight">
                  EXPLORE THE STORIES
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Search by book name to explore digital reading and printed editions by Mretyun Jai B
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-rose-500/15 backdrop-blur-xl text-rose-300 border border-rose-500/30">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'} Available
            </span>
          </div>

          {/* Search Input Filter by Book Name */}
          <div className="space-y-4 pt-2 border-t border-white/[0.08] relative z-10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="book-catalog-search-input"
                name="search"
                aria-label="Search stories catalog"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedTitle('ALL');
                }}
                placeholder="Search by book name (e.g., Can Love Survive?, Not Like This, Only If It Waits)..."
                className="w-full bg-[#080C14]/40 backdrop-blur-xl border border-white/[0.12] focus:border-rose-500/70 rounded-2xl pl-11 pr-10 py-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter by Book Title */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">
                Filter by Name:
              </span>
              {bookTitles.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTitleSelect(t)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedTitle === t && !searchQuery
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25'
                      : 'bg-[#080C14]/35 backdrop-blur-xl text-slate-300 border border-white/[0.1] hover:text-rose-200 hover:border-rose-500/45 hover:bg-rose-500/10'
                  }`}
                >
                  {t === 'ALL' ? 'ALL BOOKS' : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOOK CATALOG GRID */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] hover:border-rose-500/60 rounded-3xl p-6 shadow-2xl transition-all duration-300 group flex flex-col justify-between cursor-pointer hover:shadow-rose-500/20 hover:-translate-y-1.5 block relative overflow-hidden hover:bg-[#141C30]/45"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.04] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  {/* Book Cover Image Container */}
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-5 bg-[#05080E]/70 border border-white/[0.1]">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    
                    {/* Genre Badge */}
                    <div className="absolute top-3 left-3 bg-[#080C14]/65 backdrop-blur-xl text-rose-300 border border-rose-500/35 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      {book.genre}
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="space-y-2.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-rose-100 group-hover:text-rose-300 transition-colors">
                      {book.title}
                    </h2>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
                      {book.description}
                    </p>
                  </div>
                </div>

                {/* Centered Pricing */}
                <div className="pt-5 mt-5 border-t border-white/[0.08] text-center relative z-10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                    Digital Reading
                  </span>
                  <span className="font-serif text-2xl font-bold text-rose-300 tracking-tight">
                    ₹{book.digitalPrice}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[#0E1422]/80 backdrop-blur-xl border border-[#1E293E] rounded-3xl p-12 text-center text-slate-400 space-y-4">
            <Search className="w-10 h-10 text-rose-500/40 mx-auto" />
            <h3 className="font-serif text-xl text-rose-200">No story found with that name</h3>
            <p className="text-xs text-slate-400">
              Please check the spelling or select from all available books above.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTitle('ALL');
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition-all cursor-pointer"
            >
              SHOW ALL BOOKS
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
