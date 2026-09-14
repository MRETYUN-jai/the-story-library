'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Bookshelf from '@/components/Bookshelf';
import {
  BookOpen,
  History,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Heart,
  Award,
  Flame,
  Compass,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MyLibraryClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  unlockedBooks: any[];
  lockedBooks?: any[];
  lastReadBook?: any;
  purchases: any[];
}

export default function MyLibraryClient({
  user,
  unlockedBooks,
  lastReadBook,
  purchases,
}: MyLibraryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'history'>('books');
  const [localUnlockedBooks, setLocalUnlockedBooks] = useState(unlockedBooks);
  const [activeHeroBook, setActiveHeroBook] = useState(lastReadBook);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updated = unlockedBooks.map((b) => {
      const savedBookmark = localStorage.getItem(`storyvault_bookmark_${b.slug}`);
      const savedPage = localStorage.getItem(`storyvault_page_${b.slug}`);
      const savedPercent = localStorage.getItem(`storyvault_percent_${b.slug}`);

      const parsedBookmark = savedBookmark ? parseInt(savedBookmark, 10) : null;
      const parsedPage = savedPage ? parseInt(savedPage, 10) : null;
      const parsedPercent = savedPercent ? parseFloat(savedPercent) : null;

      const pageNumber = parsedBookmark || parsedPage || b.pageNumber || 1;
      let progressPercent =
        parsedPercent !== null && parsedPercent > 0
          ? parsedPercent
          : b.progressPercent || 0;

      if (progressPercent === 0 && pageNumber > 1) {
        progressPercent = Math.min(100, Math.max(1, Math.round((pageNumber / 193) * 100)));
      }

      return {
        ...b,
        pageNumber,
        bookmarkPage: parsedBookmark || b.bookmarkPage,
        progressPercent,
      };
    });

    setLocalUnlockedBooks(updated);

    const active =
      updated.find(
        (b) =>
          (b.bookmarkPage && b.bookmarkPage > 1) ||
          (b.pageNumber && b.pageNumber > 1) ||
          (b.progressPercent && b.progressPercent > 0)
      ) || updated[0];

    if (active) {
      setActiveHeroBook(active);
    }
  }, [unlockedBooks]);



  const totalCompleted = localUnlockedBooks.filter(
    (b) => (b.progressPercent || 0) >= 98
  ).length;

  return (
    <div className="min-h-screen bg-transparent text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* DASHBOARD HEADER */}
        {(() => {
          const displayName = user ? user.name.replace(/\s*\([^)]*\)/g, '').trim() : 'Reader';
          return (
            <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.05] to-transparent pointer-events-none" />

              <div className="space-y-2.5 relative z-10 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-500/15 backdrop-blur-xl px-3.5 py-1 rounded-full border border-rose-500/30 shadow-sm">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Digital Sanctuary Library</span>
                  </span>
                  {user?.role === 'ADMIN' && (
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Author & Admin
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-rose-100 tracking-tight">
                  {user ? `Welcome back, ${displayName}` : 'My Digital Library'}
                </h1>

                <p className="text-xs text-slate-400 font-sans flex items-center gap-2">
                  <span>{user ? user.email : 'Your personal collection of unlocked stories'}</span>
                  {user && <span>•</span>}
                  {user && <span className="text-rose-300/80 font-medium">Active Digital Vault</span>}
                </p>
              </div>

              {/* Navigation Tabs (Segmented Control) */}
              {user && (
                <div className="inline-flex items-center gap-1.5 bg-[#080C14]/50 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/[0.12] relative z-10 shrink-0 shadow-lg">
                  <button
                    onClick={() => setActiveTab('books')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      activeTab === 'books'
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/50'
                        : 'text-slate-400 hover:text-rose-200 hover:bg-rose-500/10'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>My Books</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        activeTab === 'books'
                          ? 'bg-black/25 text-white'
                          : 'bg-white/[0.08] text-slate-300'
                      }`}
                    >
                      {localUnlockedBooks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      activeTab === 'history'
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 ring-1 ring-rose-400/50'
                        : 'text-slate-400 hover:text-rose-200 hover:bg-rose-500/10'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Purchases</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        activeTab === 'history'
                          ? 'bg-black/25 text-white'
                          : 'bg-white/[0.08] text-slate-300'
                      }`}
                    >
                      {purchases.length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 1: MY BOOKS */}
        {activeTab === 'books' && (
          <div className="space-y-10 animate-gentle-fade">
            {localUnlockedBooks.length > 0 ? (
              <>
                {/* STATS OVERVIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        BOUGHT BOOKS
                      </span>
                      <p className="font-serif text-2xl font-bold text-rose-100">
                        {localUnlockedBooks.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        COMPLETED STORIES
                      </span>
                      <p className="font-serif text-2xl font-bold text-emerald-300">
                        {totalCompleted}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-2xl p-5 shadow-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        READING STATUS
                      </span>
                      <p className="font-serif text-base font-bold text-amber-200">
                        Active Reader
                      </p>
                    </div>
                  </div>
                </div>

                {/* RESUME READING HERO BANNER */}
                {activeHeroBook && (
                  <div className="bg-gradient-to-r from-[#171120]/45 via-[#0E1422]/40 to-[#1A0E18]/45 backdrop-blur-3xl border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                      <img
                        src={activeHeroBook.coverImage}
                        alt={activeHeroBook.title}
                        className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-xl border border-rose-500/40 shadow-xl"
                      />
                      <div className="flex-1 space-y-3 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                            CONTINUE READING
                          </span>
                          {activeHeroBook.bookmarkPage && (
                            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                              <span>🔖 Ribbon Bookmark at Page {activeHeroBook.bookmarkPage}</span>
                            </span>
                          )}
                        </div>

                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100">
                          {activeHeroBook.title}
                        </h2>
                        
                        <div className="space-y-1 max-w-sm mx-auto sm:mx-0">
                          <div className="flex justify-between text-xs text-slate-300 font-semibold">
                            <span>Reading Progress</span>
                            <span className="text-rose-400 font-mono font-bold">
                              {activeHeroBook.pageNumber && activeHeroBook.pageNumber > 1
                                ? `Page ${activeHeroBook.pageNumber} • `
                                : ''}
                              {Math.round(activeHeroBook.progressPercent || 0)}% COMPLETED
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-[#080C14] rounded-full overflow-hidden border border-[#232E45]">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 via-rose-400 to-rose-300 rounded-full"
                              style={{
                                width: `${Math.round(activeHeroBook.progressPercent || 0)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link
                            href={`/read/${activeHeroBook.slug}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {activeHeroBook.pageNumber && activeHeroBook.pageNumber > 1
                                ? `RESUME READING (PAGE ${activeHeroBook.pageNumber})`
                                : 'RESUME READING'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PURCHASED BOOKSHELF GRID WITH RESUME READING */}
                <Bookshelf unlockedBooks={localUnlockedBooks} />
              </>
            ) : (
              /* EMPTY STATE: NO BOOKS BROUGHT */
              <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 sm:p-14 text-center text-slate-400 space-y-5 shadow-2xl max-w-xl mx-auto my-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-lg shadow-rose-500/10 relative z-10">
                  <BookOpen className="w-8 h-8 text-rose-400" />
                </div>
                <div className="space-y-2 relative z-10">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 uppercase tracking-wide">
                    NO BOOKS BROUGHT
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    You haven&apos;t purchased any digital stories yet. Once you buy a story, it will appear here in your personal digital sanctuary ready to read anytime.
                  </p>
                </div>
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
                  <Link
                    href="/books"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>EXPLORE STORIES TO BUY</span>
                  </Link>
                  {!user && (
                    <Link
                      href="/auth/login?redirect=/library"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#080C14]/60 backdrop-blur-sm border border-white/[0.08] hover:border-rose-500/40 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                    >
                      <span>LOG IN TO SYNC PURCHASES</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASE HISTORY */}
        {activeTab === 'history' && user && (
          <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-gentle-fade relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.02] to-transparent pointer-events-none" />

            <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2 relative z-10">
              <History className="w-5 h-5 text-rose-400" />
              Digital Reading Access Purchase Log
            </h2>

            {purchases.length > 0 ? (
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#080C14]/60 text-rose-300 font-serif border-b border-white/[0.08] uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-black/20">
                        <td className="p-3 font-mono text-[11px] text-slate-400">{p.orderId}</td>
                        <td className="p-3 font-serif text-sm text-rose-100 font-semibold">{p.book.title}</td>
                        <td className="p-3 text-slate-400">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-rose-300">₹{p.amount}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED UNLOCKED
                          </span>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/read/${p.book.slug}`}
                            className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
                          >
                            <span>RESUME READING</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No purchase records found.</p>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
