'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Bookshelf from '@/components/Bookshelf';
import PaymentModal from '@/components/PaymentModal';
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
  Clock,
  RefreshCw,
  AlertCircle,
  XCircle,
  X,
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
  pendingPurchases?: any[];
  rejectedPurchases?: any[];
}

export default function MyLibraryClient({
  user,
  unlockedBooks,
  lastReadBook,
  purchases,
  pendingPurchases = [],
  rejectedPurchases = [],
}: MyLibraryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'history' | 'pending' | 'rejected'>('books');
  const [localUnlockedBooks, setLocalUnlockedBooks] = useState(unlockedBooks);
  const [activeHeroBook, setActiveHeroBook] = useState(lastReadBook);
  const [retryBook, setRetryBook] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Notification Banner Dismissal State
  const [dismissedRejectedBanner, setDismissedRejectedBanner] = useState(false);
  const [dismissedPendingBanner, setDismissedPendingBanner] = useState(false);
  const [dismissedApprovedBanner, setDismissedApprovedBanner] = useState(false);

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
                  {pendingPurchases.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full animate-pulse">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{pendingPurchases.length} Pending Approval</span>
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
                <div className="inline-flex flex-wrap items-center gap-1.5 bg-[#080C14]/50 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/[0.12] relative z-10 shrink-0 shadow-lg">
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

                  {/* Pending Approval Tab & Notification Badge */}
                  {pendingPurchases.length > 0 && (
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'pending'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/30 ring-1 ring-amber-300'
                          : 'text-amber-300 hover:text-amber-100 hover:bg-amber-500/15'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pending Approval</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-950/40 text-amber-200 border border-amber-400/30 animate-pulse">
                        {pendingPurchases.length}
                      </span>
                    </button>
                  )}

                  {/* Rejected / Declined Tab */}
                  {rejectedPurchases.length > 0 && (
                    <button
                      onClick={() => setActiveTab('rejected')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'rejected'
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold shadow-lg shadow-rose-500/30 ring-1 ring-rose-400'
                          : 'text-rose-300 hover:text-rose-100 hover:bg-rose-500/15'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Declined</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-950/60 text-rose-200 border border-rose-500/30">
                        {rejectedPurchases.length}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* NOTIFICATION 1: REJECTED / DECLINED PAYMENT NOTIFICATION BANNER */}
        {rejectedPurchases.length > 0 && !dismissedRejectedBanner && (
          <div className="bg-gradient-to-r from-rose-500/20 via-[#1A0E18]/80 to-red-500/15 border-2 border-rose-500/50 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
            {/* Close / Dismiss Button */}
            <button
              onClick={() => setDismissedRejectedBanner(true)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all z-20 cursor-pointer shadow-sm"
              title="Close notification"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start sm:items-center gap-3.5 relative z-10 pr-6 sm:pr-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/25 text-rose-200 px-2.5 py-0.5 rounded border border-rose-500/40">
                    PAYMENT NOT VERIFIED / DECLINED
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    {rejectedPurchases.length} {rejectedPurchases.length === 1 ? 'story' : 'stories'} needs attention
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-100">
                  Payment verification declined for <strong className="text-rose-200">{rejectedPurchases[0]?.book?.title}</strong>
                </p>
                <p className="text-[11px] text-slate-300">
                  The author could not match your submitted receipt/UTR ({rejectedPurchases[0]?.utrNumber || 'N/A'}). Please check your UPI receipt or re-submit proof.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 self-end sm:self-auto shrink-0">
              <button
                onClick={() => {
                  setRetryBook(rejectedPurchases[0]?.book);
                  setIsPaymentModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RE-SUBMIT PROOF</span>
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATION 2: PENDING APPROVAL NOTIFICATION BANNER */}
        {pendingPurchases.length > 0 && !dismissedPendingBanner && (
          <div className="bg-gradient-to-r from-amber-500/15 via-[#0E1422]/65 to-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
            {/* Close / Dismiss Button */}
            <button
              onClick={() => setDismissedPendingBanner(true)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-amber-500/20 transition-all z-20 cursor-pointer shadow-sm"
              title="Close notification"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start sm:items-center gap-3.5 relative z-10 pr-6 sm:pr-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse shadow-md">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    PAYMENT VERIFICATION PENDING
                  </span>
                  <span className="text-xs text-amber-200/80 font-mono">
                    {pendingPurchases.length} {pendingPurchases.length === 1 ? 'story' : 'stories'} awaiting author approval
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-100">
                  Payment receipt submitted for <strong className="text-rose-200">{pendingPurchases[0]?.book?.title}</strong>
                </p>
                <p className="text-[11px] text-slate-300">
                  Author <strong>Mretyun Jai B</strong> has been alerted. This story will unlock automatically here as soon as approved.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('pending')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>VIEW PENDING ({pendingPurchases.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATION 3: APPROVED STORY NOTIFICATION BANNER */}
        {purchases.length > 0 && pendingPurchases.length === 0 && rejectedPurchases.length === 0 && !dismissedApprovedBanner && (
          <div className="bg-gradient-to-r from-emerald-500/15 via-[#0E1422]/60 to-rose-500/10 border border-emerald-500/35 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in relative overflow-hidden">
            {/* Close / Dismiss Button */}
            <button
              onClick={() => setDismissedApprovedBanner(true)}
              className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-all z-20 cursor-pointer shadow-sm"
              title="Close notification"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 relative z-10 pr-6 sm:pr-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    APPROVED & UNLOCKED
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                  Permanent lifetime reading access active for <strong className="text-rose-200">{purchases[0]?.book?.title || 'your purchased books'}</strong>
                </p>
              </div>
            </div>
            <Link
              href={`/read/${purchases[0]?.book?.slug}`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-auto shadow-md shadow-emerald-500/20"
            >
              <span>START READING</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

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
                      <Image
                        src={activeHeroBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                        alt={activeHeroBook.title}
                        width={120}
                        height={180}
                        className="rounded-xl shadow-2xl border border-white/[0.15] object-cover shrink-0"
                      />
                      <div className="space-y-3 flex-1 text-center sm:text-left">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full">
                          CONTINUE READING
                        </span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100">
                          {activeHeroBook.title}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
                          <span>Page {activeHeroBook.pageNumber || 1}</span>
                          <span>•</span>
                          <span>{activeHeroBook.progressPercent || 0}% Completed</span>
                        </div>
                        <div className="pt-2">
                          <Link
                            href={`/read/${activeHeroBook.slug}`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all"
                          >
                            <span>RESUME READING</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ALL UNLOCKED BOOKS */}
                <Bookshelf unlockedBooks={localUnlockedBooks} />
              </>
            ) : (
              <div className="text-center py-16 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-slate-200">Your digital library is waiting</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Unlock stories to start reading and build your personal collection.
                </p>
                <div className="pt-2">
                  <Link
                    href="/books"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all"
                  >
                    <span>EXPLORE ALL STORIES</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASE HISTORY */}
        {activeTab === 'history' && user && (
          <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-gentle-fade relative overflow-hidden">
            <h2 className="font-serif text-xl font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" />
              <span>Purchase History</span>
            </h2>

            {purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-mono">
                      <th className="p-3">Book</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 font-serif font-bold text-rose-200">{p.book.title}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">₹{p.amount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            COMPLETED
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {new Date(p.purchasedAt || p.createdAt).toLocaleDateString()}
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

        {/* TAB 3: PENDING APPROVAL */}
        {activeTab === 'pending' && user && (
          <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-gentle-fade relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.04] to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-amber-500/15 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  Payments Awaiting Author Approval
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Once the author verifies your 12-digit UTR reference, your books will instantly unlock for reading.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 text-xs font-mono font-bold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {pendingPurchases.length} Pending Verification
              </span>
            </div>

            {pendingPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {pendingPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-[#12192A]/90 to-[#0A0E1A]/90 border border-amber-500/20 shadow-lg flex flex-col justify-between gap-4 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {p.book.coverImage && (
                        <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative shadow-md">
                          <img
                            src={p.book.coverImage}
                            alt={p.book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mb-1.5 font-bold">
                          VERIFICATION PENDING
                        </span>
                        <h3 className="font-serif font-bold text-rose-100 text-base truncate">
                          {p.book.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Amount: <span className="font-bold text-amber-300">₹{p.amount}</span>
                        </p>
                        {p.utrNumber && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            UTR: <span className="font-mono text-slate-200 font-bold tracking-wider">{p.utrNumber}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                          Submitted: {new Date(p.purchasedAt || (p as any).createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                      <span className="text-[11px] text-slate-400 italic">
                        Checking every minute...
                      </span>
                      <Link
                        href={`/books/${p.book.slug}`}
                        className="font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 group"
                      >
                        <span>View Status</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-medium text-slate-300">No pending payments found.</p>
                <p className="text-xs text-slate-500 mt-1">All your submitted payments have been reviewed!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DECLINED / REJECTED PAYMENTS */}
        {activeTab === 'rejected' && user && (
          <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-rose-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-gentle-fade relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.04] to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-rose-500/15 pb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Declined Payment Submissions</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  The following payments could not be verified by the author. You can re-submit your receipt or UTR number below.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/25 text-xs font-mono font-bold self-start sm:self-auto">
                {rejectedPurchases.length} Declined
              </span>
            </div>

            {rejectedPurchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {rejectedPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-[#1A0E18]/90 to-[#0E1422]/90 border border-rose-500/30 shadow-lg flex flex-col justify-between gap-4 hover:border-rose-500/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {p.book.coverImage && (
                        <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative shadow-md">
                          <img
                            src={p.book.coverImage}
                            alt={p.book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 inline-block mb-1.5 font-bold">
                          VERIFICATION DECLINED
                        </span>
                        <h3 className="font-serif font-bold text-rose-100 text-base truncate">
                          {p.book.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Amount: <span className="font-bold text-rose-300">₹{p.amount}</span>
                        </p>
                        {p.utrNumber && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Submitted UTR: <span className="font-mono text-slate-300 font-bold tracking-wider">{p.utrNumber}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-rose-300/80 mt-1">
                          Please verify your UPI reference and re-submit proof to unlock.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                      <Link
                        href={`/books/${p.book.slug}`}
                        className="text-slate-400 hover:text-rose-300 transition-colors text-xs"
                      >
                        Book Details
                      </Link>
                      <button
                        onClick={() => {
                          setRetryBook(p.book);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>RE-SUBMIT PROOF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
                <p className="text-sm font-medium text-slate-300">No declined payments found.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* RETRY PAYMENT MODAL */}
      {retryBook && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setRetryBook(null);
          }}
          book={{
            id: retryBook.id,
            title: retryBook.title,
            slug: retryBook.slug,
            price: retryBook.digitalPrice || 199,
            currency: retryBook.currency || 'INR',
            coverImage: retryBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
          }}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setRetryBook(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
