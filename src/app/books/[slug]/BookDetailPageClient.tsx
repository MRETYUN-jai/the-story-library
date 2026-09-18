'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import ExternalRedirectModal from '@/components/ExternalRedirectModal';
import {
  BookOpen,
  Lock,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Heart,
  Share2,
  Copy,
  Check,
  Feather,
  BookMarked,
  ShieldCheck,
  Edit3,
  Loader2,
  X,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface BookDetailPageClientProps {
  book: {
    id: string;
    title: string;
    slug: string;
    description: string;
    genre: string;
    coverImage: string;
    digitalPrice: number;
    currency: string;
    paperbackEnabled: boolean;
    paperbackPublisher?: string | null;
    paperbackLink?: string | null;
    hardcoverEnabled: boolean;
    hardcoverPublisher?: string | null;
    hardcoverLink?: string | null;
    kindleEnabled?: boolean;
    kindlePublisher?: string | null;
    kindleLink?: string | null;
    series?: { name: string } | null;
    bookNumber?: number | null;
    chapters?: Array<{ id: string; chapterNumber: number; title: string }>;
  };
  isPurchased?: boolean;
  initialPending?: boolean;
  initialPendingOrder?: {
    orderId?: string;
    utrNumber?: string | null;
    amount?: number;
    purchasedAt?: string;
  } | null;
  initialRejected?: boolean;
  initialRejectedOrder?: {
    orderId?: string;
    utrNumber?: string | null;
    amount?: number;
    purchasedAt?: string;
  } | null;
}

export default function BookDetailPageClient({
  book,
  isPurchased = false,
  initialPending = false,
  initialPendingOrder = null,
  initialRejected = false,
  initialRejectedOrder = null,
}: BookDetailPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoBuy = searchParams?.get('buy') === 'true';

  const [currentBook, setCurrentBook] = useState(book);
  const [user, setUser] = useState<{ id: string; role?: string } | null>(null);
  
  // Instantaneous state initialization from server props & client cache (Zero flicker)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (isPurchased) return true;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`storyvault_unlocked_${book.slug}`);
      if (cached === 'true') return true;
    }
    return false;
  });

  const [isPendingApproval, setIsPendingApproval] = useState(initialPending && !isPurchased);
  const [pendingOrderInfo, setPendingOrderInfo] = useState<{
    orderId?: string;
    utrNumber?: string | null;
    amount?: number;
    purchasedAt?: string;
  } | null>(initialPendingOrder);

  const [isRejected, setIsRejected] = useState(initialRejected && !isPurchased && !initialPending);
  const [rejectedOrderInfo, setRejectedOrderInfo] = useState<{
    orderId?: string;
    utrNumber?: string | null;
    amount?: number;
    purchasedAt?: string;
  } | null>(initialRejectedOrder);

  const [checkingPendingStatus, setCheckingPendingStatus] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'synopsis' | 'chapters' | 'quote'>('synopsis');
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Admin Quick Description Edit State
  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [editDescription, setEditDescription] = useState(book.description);
  const [savingDescription, setSavingDescription] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [redirectModalData, setRedirectModalData] = useState<{
    isOpen: boolean;
    url: string;
    editionName: string;
    publisherName: string;
  }>({
    isOpen: false,
    url: '',
    editionName: '',
    publisherName: '',
  });

  const checkUserAccess = useCallback(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          const unlocked = isPurchased || data.purchasedBookIds?.includes(currentBook.id) || data.user.role === 'ADMIN';
          if (unlocked) {
            setIsUnlocked(true);
            setIsPendingApproval(false);
            setIsRejected(false);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`storyvault_unlocked_${currentBook.slug}`, 'true');
            }
          } else {
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`storyvault_unlocked_${currentBook.slug}`);
            }
            const isPending = data.pendingBookIds?.includes(currentBook.id);
            const pendingOrder = data.pendingPurchases?.find((p: any) => p.bookId === currentBook.id);
            const isRej = data.rejectedBookIds?.includes(currentBook.id);
            const rejectedOrder = data.rejectedPurchases?.find((p: any) => p.bookId === currentBook.id);

            if (isPending) {
              setIsPendingApproval(true);
              setPendingOrderInfo(pendingOrder || null);
              setIsRejected(false);
            } else if (isRej) {
              setIsPendingApproval(false);
              setIsRejected(true);
              setRejectedOrderInfo(rejectedOrder || null);
            } else {
              setIsPendingApproval(false);
              setIsRejected(false);
              if (autoBuy) {
                setIsPaymentModalOpen(true);
              }
            }
          }
        } else if (autoBuy && !isUnlocked) {
          setIsPaymentModalOpen(true);
        }
      })
      .catch(() => {});
  }, [currentBook.id, currentBook.slug, autoBuy, isPurchased, isUnlocked]);

  useEffect(() => {
    checkUserAccess();

    // ⚡ Speculative prefetching: Warm up reader page and PDF stream in background
    try {
      router.prefetch(`/read/${currentBook.slug}`);
      router.prefetch(`/read/${currentBook.slug}?sample=true`);
      
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.as = 'fetch';
      prefetchLink.href = `/api/reader/stream-pdf/${currentBook.slug}`;
      document.head.appendChild(prefetchLink);
    } catch {}
  }, [currentBook.slug, router, checkUserAccess]);

  const handleRefreshPendingStatus = async () => {
    setCheckingPendingStatus(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        const unlocked = data.purchasedBookIds?.includes(currentBook.id) || data.user.role === 'ADMIN';
        if (unlocked) {
          setIsUnlocked(true);
          setIsPendingApproval(false);
          setIsRejected(false);
        } else {
          const isPending = data.pendingBookIds?.includes(currentBook.id);
          const pendingOrder = data.pendingPurchases?.find((p: any) => p.bookId === currentBook.id);
          const isRej = data.rejectedBookIds?.includes(currentBook.id);
          const rejectedOrder = data.rejectedPurchases?.find((p: any) => p.bookId === currentBook.id);
          
          setIsPendingApproval(!!isPending);
          if (isPending) {
            setPendingOrderInfo(pendingOrder || null);
            setIsRejected(false);
          } else if (isRej) {
            setIsRejected(true);
            setRejectedOrderInfo(rejectedOrder || null);
          } else {
            setIsRejected(false);
          }
        }
      }
    } catch {} finally {
      setCheckingPendingStatus(false);
    }
  };

  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDescription.trim()) return;
    setSavingDescription(true);
    setAdminFeedback(null);

    try {
      const res = await fetch('/api/admin/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentBook.id,
          description: editDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update book description');
      }

      setCurrentBook((prev) => ({ ...prev, description: editDescription.trim() }));
      setAdminFeedback({ type: 'success', text: 'Book description updated successfully!' });
      setTimeout(() => {
        setIsAdminEditOpen(false);
        setAdminFeedback(null);
      }, 1200);
    } catch (err: any) {
      setAdminFeedback({ type: 'error', text: err.message || 'Error updating description' });
    } finally {
      setSavingDescription(false);
    }
  };

  const handleDigitalBuyClick = () => {
    if (isUnlocked) {
      router.push(`/read/${currentBook.slug}`);
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handlePhysicalClick = (url: string, editionName: string, publisherName: string) => {
    const skipModal = localStorage.getItem('skip_external_redirect_modal');
    if (skipModal === 'true') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setRedirectModalData({
        isOpen: true,
        url,
        editionName,
        publisherName,
      });
    }
  };

  // Curated literary quotes per book that randomize on refresh and shuffle on click
  const BOOK_QUOTES_MAP: Record<string, string[]> = {
    'can-love-survive': [
      '“Rain makes you remember everything you tried to hide under the sun.”',
      '“We were two souls caught in a silence that was louder than any confession.”',
      '“The hardest part of moving on is realizing that the silence between two people is also an answer.”',
      '“Every raindrop against the glass is an echo of a conversation we never got to finish.”',
      '“You don’t just lose someone all at once; you lose them in every quiet moment when you wish they were there.”',
      '“Love never dies from distance; it dies from the pride that stops us from reaching across it.”',
    ],
    'not-like-this': [
      '“Pride tells you that staying back protects your honor, while in reality, it only seals your loneliness.”',
      '“Sometimes holding on hurts infinitely more than walking away with your dignity intact.”',
      '“You cannot pour your whole heart into someone whose hands are already closed.”',
      '“There is a sacred quiet in loving someone from a distance where they can no longer hurt you.”',
      '“The truth was never that I stopped loving you; it was that I finally had to love myself more.”',
      '“We promised not like this, yet here we stand—two strangers built out of shared memories.”',
    ],
    'only-if-it-waits': [
      '“Forgiveness isn’t forgetting the hurt. It’s choosing to love despite knowing the hurt existed.”',
      '“If love was meant to survive, time was never the enemy—it was only the test.”',
      '“Perhaps true love is not about never parting, but knowing you would still choose each other across lifetimes.”',
      '“We spent years running from the truth, only to realize that every road led back to the same unanswered question.”',
      '“Forgiveness is not pretending the wound never happened; it is choosing to let the light shine through the scar.”',
      '“Some hearts are worth waiting for, even if the waiting feels like an eternity in the dark.”',
    ],
    'the-letters-we-never-sent': [
      '“We write the longest letters to the people who will never read them.”',
      '“Midnight does not create your overthinking; it simply strips away the noise of the day.”',
      '“In the end, we only regret the words we choked back because we were too afraid to appear vulnerable.”',
      '“Some letters are written in ink; the deepest ones are written in memories we cannot burn.”',
      '“I wrote you a thousand apologies in my head, but not a single one ever reached your mailbox.”',
    ],
    'where-rain-meets-the-river': [
      '“Some people aren’t meant to stay in your life; they are only meant to awaken your heart.”',
      '“Memories are warm until you realize you are feeling them alone in the cold.”',
      '“Healing doesn’t mean the damage never existed; it means the damage no longer controls your life.”',
      '“The river never asks the rain why it fell; it simply takes it in and continues forward.”',
      '“In the quietest corners of the world, broken pieces slowly find their way back together.”',
    ],
  };

  const DEFAULT_QUOTES = [
    '“Some words are never spoken, yet they echo through every quiet midnight.”',
    '“A story begins where silence becomes unbearable.”',
    '“Every memory has a heartbeat if you listen quietly enough.”',
    '“We search for answers in old chapters, hoping the ending has somehow changed.”',
  ];

  const bookQuotesList = BOOK_QUOTES_MAP[book.slug] || DEFAULT_QUOTES;
  const [activeQuote, setActiveQuote] = useState(bookQuotesList[0]);
  const [quoteFade, setQuoteFade] = useState(true);

  // Randomize quote on every page load / refresh
  useEffect(() => {
    const list = BOOK_QUOTES_MAP[book.slug] || DEFAULT_QUOTES;
    const randomIndex = Math.floor(Math.random() * list.length);
    setActiveQuote(list[randomIndex]);
  }, [book.slug]);

  const handleShuffleQuote = () => {
    setQuoteFade(false);
    setTimeout(() => {
      const list = BOOK_QUOTES_MAP[book.slug] || DEFAULT_QUOTES;
      let nextIndex = Math.floor(Math.random() * list.length);
      while (list[nextIndex] === activeQuote && list.length > 1) {
        nextIndex = Math.floor(Math.random() * list.length);
      }
      setActiveQuote(list[nextIndex]);
      setQuoteFade(true);
    }, 200);
  };

  const copyQuoteToClipboard = () => {
    navigator.clipboard.writeText(`${activeQuote} — Mretyun Jai B`);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* TOP SECTION: BOOK COVER & CORE DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Cover Image with 3D Depth */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative aspect-[2/3] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-white/[0.12] bg-[#05080E]/80 group">
              <div className="relative w-full h-full">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 40vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1422]/60 via-transparent to-transparent opacity-60 pointer-events-none" />
              
              {isUnlocked ? (
                <div className="absolute top-4 right-4 bg-rose-500 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5" />
                  UNLOCKED ACCESS
                </div>
              ) : isPendingApproval ? (
                <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 px-3.5 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-slate-950" />
                  APPROVAL PENDING
                </div>
              ) : isRejected ? (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                  PAYMENT DECLINED
                </div>
              ) : null}
            </div>
          </div>

          {/* Book Summary Info */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {currentBook.series && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 backdrop-blur-xl text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-widest">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      {currentBook.series.name} {currentBook.bookNumber ? `• Book ${currentBook.bookNumber}` : ''}
                    </div>
                  )}
                  <span className="px-3 py-1 rounded-full bg-[#161F33]/50 backdrop-blur-xl text-rose-300/90 text-xs font-semibold border border-white/[0.1]">
                    {currentBook.genre}
                  </span>
                </div>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setEditDescription(currentBook.description);
                      setIsAdminEditOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                    <span>EDIT DESCRIPTION (ADMIN)</span>
                  </button>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-rose-100 tracking-tight">
                {currentBook.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
                <span>By <strong className="text-rose-300">Mretyun Jai B</strong></span>
                <span>•</span>
                <span className="text-rose-400 font-medium">{currentBook.genre}</span>
                <span>•</span>
                <span>{currentBook.chapters?.length || 'Full'} Chapters</span>
                <span>•</span>
                <span className="text-slate-500">English Edition</span>
              </div>

              {/* DETAILED SYNOPSIS & NARRATIVE BLOCK */}
              <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-rose-400" />
                    <span>SYNOPSIS & NARRATIVE OVERVIEW</span>
                  </h3>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setEditDescription(currentBook.description);
                        setIsAdminEditOpen(true);
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line space-y-2 bg-[#090E1A]/40 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/[0.1] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  {currentBook.description}
                </div>
              </div>

              {/* STORY HIGHLIGHTS PILLS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-[#090E1A]/40 backdrop-blur-xl border border-white/[0.1] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NARRATIVE FORMAT</span>
                  <p className="text-xs font-serif text-rose-200 font-semibold mt-0.5">
                    {currentBook.slug === 'not-like-this'
                      ? 'Trilogy Branch Path A'
                      : currentBook.slug === 'only-if-it-waits'
                      ? 'Trilogy Branch Path B'
                      : 'Trilogy Canon Foundation'}
                  </p>
                </div>
                <div className="bg-[#090E1A]/40 backdrop-blur-xl border border-white/[0.1] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SECURITY & DRM</span>
                  <p className="text-xs font-serif text-rose-200 font-semibold mt-0.5">Dynamic Forensic DRM</p>
                </div>
                <div className="bg-[#090E1A]/40 backdrop-blur-xl border border-white/[0.1] p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">READING CANVAS</span>
                  <p className="text-xs font-serif text-rose-200 font-semibold mt-0.5">Continuous Flow & Ribbon</p>
                </div>
              </div>
            </div>

            {/* ACTIVE READING BADGE IF UNLOCKED */}
            {isUnlocked ? (
              <div className="pt-2">
                <div className="bg-gradient-to-r from-rose-500/15 via-[#161F33]/50 to-[#121A2C]/50 backdrop-blur-2xl border-2 border-rose-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
                      <CheckCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                          PAYMENT APPROVED
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-rose-100 mt-0.5">Digital Access Active & Unlocked</h4>
                      <p className="text-xs text-rose-300/80">Full digital manuscript unlocked in your vault</p>
                    </div>
                  </div>

                  <Link
                    href={`/read/${currentBook.slug}`}
                    prefetch={true}
                    className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>RESUME READING NOW</span>
                  </Link>
                </div>
              </div>
            ) : isPendingApproval ? (
              <div className="pt-2">
                <div className="bg-gradient-to-r from-amber-500/15 via-[#1E1710]/50 to-[#141A24]/50 backdrop-blur-2xl border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 animate-pulse">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          APPROVAL PENDING
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-amber-200 mt-0.5">Payment Verification in Progress</h4>
                      <p className="text-xs text-slate-300">
                        Payment proof submitted {pendingOrderInfo?.utrNumber ? `(UTR: ${pendingOrderInfo.utrNumber})` : ''}. Unlocks upon author approval.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRefreshPendingStatus}
                    disabled={checkingPendingStatus}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingPendingStatus ? 'animate-spin' : ''}`} />
                    <span>CHECK STATUS</span>
                  </button>
                </div>
              </div>
            ) : isRejected ? (
              <div className="pt-2">
                <div className="bg-gradient-to-r from-rose-500/20 via-[#200E14]/80 to-red-500/15 backdrop-blur-2xl border-2 border-rose-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/25 flex items-center justify-center text-rose-300 shrink-0">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/25 text-rose-200 px-2 py-0.5 rounded border border-rose-500/40">
                          PAYMENT DECLINED
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-rose-100 mt-0.5">Verification Declined / Proof Not Matched</h4>
                      <p className="text-xs text-slate-300">
                        Submitted proof {rejectedOrderInfo?.utrNumber ? `(UTR: ${rejectedOrderInfo.utrNumber})` : ''} could not be confirmed. Please re-check UPI or re-submit proof.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDigitalBuyClick}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>RE-SUBMIT PROOF</span>
                  </button>
                </div>
              </div>
            ) : null}

          </div>

        </div>

        {/* CHOOSE FORMAT & EXPERIENCE / BUYING SECTION */}
        <div id="buying-section" className="space-y-8 scroll-mt-24">
          
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-rose-100 font-bold tracking-tight">
              CHOOSE HOW YOU WANT TO EXPERIENCE THIS STORY
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Instant digital reading access or physical printed editions delivered to your doorstep
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* OPTION 1: DIGITAL EDITION */}
            <div className="bg-[#0E1422]/35 backdrop-blur-3xl border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.06] to-transparent pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-500/15 backdrop-blur-xl px-3 py-1 rounded-full border border-rose-500/35 flex items-center gap-1.5 shadow-sm">
                    <BookOpen className="w-3.5 h-3.5" />
                    DIGITAL EDITION
                  </span>
                  <span className="font-serif text-2xl font-bold text-rose-300">
                    ₹{book.digitalPrice}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-rose-100">
                  Read Instantly Inside StoryVault
                </h3>

                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Canvas Reader with Continuous Scroll & Night / Sepia modes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Direct UPI payment verification with zero extra fee
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Reading progress automatically synced across devices
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Permanent lifetime access in My Library
                  </li>
                </ul>

                {isPendingApproval && !isUnlocked ? (
                  <div className="bg-amber-500/10 backdrop-blur-xl rounded-xl p-3.5 border border-amber-500/30 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                      <p className="font-bold text-amber-300">Approval Pending — Verification in Progress</p>
                      <p>Your payment receipt has been submitted to author <strong>Mretyun Jai B</strong>. As soon as the author approves your transfer, this book will unlock immediately. You will also receive an email notification.</p>
                    </div>
                  </div>
                ) : isRejected && !isUnlocked ? (
                  <div className="bg-rose-500/15 backdrop-blur-xl rounded-xl p-3.5 border border-rose-500/40 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-rose-200/90 leading-relaxed space-y-1">
                      <p className="font-bold text-rose-300">Payment Verification Declined</p>
                      <p>The author could not match your previous payment proof {rejectedOrderInfo?.utrNumber ? `(${rejectedOrderInfo.utrNumber})` : ''}. Please re-submit your 12-digit UTR or receipt screenshot below.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#080C14]/40 backdrop-blur-xl rounded-xl p-3.5 border border-rose-500/25 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-200/90 leading-relaxed">
                      &ldquo;Your purchase unlocks online digital reading access. Downloadable PDF/EPUB files are not distributed to protect copyright.&rdquo;
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2 relative z-10">
                {!isUnlocked && (
                  <Link
                    href={`/read/${book.slug}?sample=true`}
                    prefetch={true}
                    className="w-full py-3 px-6 rounded-xl bg-[#161F31]/40 backdrop-blur-xl border border-white/[0.12] hover:border-rose-500/50 text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2 hover:bg-rose-500/10"
                  >
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span>📖 READ FREE SAMPLE (FIRST CHAPTER)</span>
                  </Link>
                )}

                {isUnlocked ? (
                  <button
                    onClick={handleDigitalBuyClick}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>READ FULL STORY NOW</span>
                  </button>
                ) : isPendingApproval ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleRefreshPendingStatus}
                      disabled={checkingPendingStatus}
                      className="w-full py-3.5 px-6 rounded-xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-200 hover:bg-amber-500/30 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>{checkingPendingStatus ? 'CHECKING STATUS...' : '⏳ APPROVAL PENDING — VERIFYING PAYMENT'}</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Tap above to refresh approval status or check your email for confirmation.
                    </p>
                  </div>
                ) : isRejected ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleDigitalBuyClick}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>RE-SUBMIT PAYMENT PROOF (₹{book.digitalPrice})</span>
                    </button>
                    <p className="text-[10px] text-rose-300/80 text-center">
                      Re-enter your 12-digit UPI UTR number or upload receipt screenshot.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleDigitalBuyClick}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>BUY & UNLOCK DIGITAL ACCESS (₹{book.digitalPrice})</span>
                  </button>
                )}
              </div>

            </div>

            {/* OPTION 2: PHYSICAL & KINDLE EDITIONS */}
            <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-500/[0.03] to-transparent pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300 bg-slate-800/40 backdrop-blur-xl px-3 py-1 rounded-full border border-white/[0.1]">
                  PRINTED EDITIONS
                </span>

                <h3 className="font-serif text-xl font-bold text-slate-200">
                  Own a Physical Print Edition
                </h3>

                <p className="text-xs text-slate-400">
                  Printed editions are produced, bound, and delivered by official publishing partners.
                </p>

                <div className="space-y-3 pt-2">
                  
                  {/* Paperback Option */}
                  {book.paperbackEnabled && book.paperbackLink && (
                    <div className="bg-[#080C14]/40 backdrop-blur-xl rounded-2xl p-4 border border-white/[0.1] flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-rose-200">📖 PAPERBACK</h4>
                        <p className="text-[11px] text-slate-400">Softcover Edition • {book.paperbackPublisher || 'Pothi Publishing (pothi.com)'}</p>
                      </div>

                      <button
                        onClick={() => handlePhysicalClick(book.paperbackLink!, 'Paperback Edition', book.paperbackPublisher || 'Pothi Publishing')}
                        className="py-2 px-3.5 rounded-lg bg-[#161F31]/80 backdrop-blur-sm border border-white/[0.1] hover:border-rose-500/50 hover:bg-rose-500/15 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>BUY PAPERBACK</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hardcover Option */}
                  {book.hardcoverEnabled && book.hardcoverLink && (
                    <div className="bg-[#080C14]/60 backdrop-blur-md rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-rose-200">📕 HARDCOVER</h4>
                        <p className="text-[11px] text-slate-400">Collector&apos;s Edition • {book.hardcoverPublisher || 'Pothi Publishing (pothi.com)'}</p>
                      </div>

                      <button
                        onClick={() => handlePhysicalClick(book.hardcoverLink!, 'Hardcover Edition', book.hardcoverPublisher || 'Pothi Publishing')}
                        className="py-2 px-3.5 rounded-lg bg-[#161F31]/80 backdrop-blur-sm border border-white/[0.1] hover:border-rose-500/50 hover:bg-rose-500/15 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>BUY HARDCOVER</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic text-center">
                * Clicking physical buttons redirects you to the publisher&apos;s checkout page.
              </div>

            </div>

          </div>

        </div>

        {/* LITERARY QUOTE & MEMORY SECTION */}
        <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />
          
          <button
            onClick={handleShuffleQuote}
            title="Click to discover another quote"
            className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 hover:scale-110 hover:border-rose-400 hover:bg-rose-500/30 transition-all cursor-pointer shadow-lg shadow-rose-950/40"
          >
            <Feather className="w-5 h-5 text-rose-400 transition-transform group-hover:rotate-6" />
          </button>
          
          <div className="min-h-[72px] flex items-center justify-center">
            <p className={`font-serif italic text-lg sm:text-xl text-rose-100/90 max-w-2xl mx-auto leading-relaxed transition-all duration-200 ${
              quoteFade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}>
              {activeQuote}
            </p>
          </div>

          <span className="text-xs text-rose-400 font-mono block tracking-wider">— Mretyun Jai B</span>
          
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={copyQuoteToClipboard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141C2E] border border-[#27364F] hover:border-rose-500/40 text-rose-300 text-xs font-bold transition-all shadow hover:bg-[#182238] active:scale-95"
            >
              {copiedQuote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>QUOTE COPIED TO CLIPBOARD!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY QUOTE TO SHARE</span>
                </>
              )}
            </button>

            <button
              onClick={handleShuffleQuote}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141C2E]/60 border border-[#27364F]/80 hover:border-rose-500/30 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all shadow hover:bg-[#182238] active:scale-95"
              title="Shuffle another quote"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${!quoteFade ? 'animate-spin' : ''}`} />
              <span>SHUFFLE QUOTE</span>
            </button>
          </div>
        </div>

      </div>

      {/* External Redirect Modal */}
      <ExternalRedirectModal
        isOpen={redirectModalData.isOpen}
        onClose={() => setRedirectModalData((prev) => ({ ...prev, isOpen: false }))}
        targetUrl={redirectModalData.url}
        editionName={redirectModalData.editionName}
        publisherName={redirectModalData.publisherName}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        book={{
          id: currentBook.id,
          title: currentBook.title,
          slug: currentBook.slug,
          price: currentBook.digitalPrice,
          currency: currentBook.currency,
          coverImage: currentBook.coverImage,
        }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setIsUnlocked(true);
          router.push(`/read/${currentBook.slug}`);
          router.refresh();
        }}
      />

      {/* ADMIN EDIT BOOK DESCRIPTION MODAL */}
      {isAdminEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1E293E] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-rose-100">
                    Edit Book Description
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Author & Admin Control • &ldquo;{currentBook.title}&rdquo;
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAdminEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151D2F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  adminFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {adminFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{adminFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveDescription} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold block">
                    Detailed Synopsis & Story Description
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {editDescription.length} characters • {editDescription.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                <textarea
                  rows={10}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter multi-paragraph synopsis, narrative background, emotional themes, and story overview..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-2xl p-4 text-slate-200 font-sans leading-relaxed text-xs sm:text-sm focus:outline-none shadow-inner"
                />

                <p className="text-[11px] text-slate-500 mt-1.5">
                  💡 Tip: Line breaks and multiple paragraphs entered here will be formatted cleanly on the book details page to fill the space.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293E]">
                <button
                  type="button"
                  onClick={() => setIsAdminEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#283652] text-slate-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingDescription}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-wider cursor-pointer"
                >
                  {savingDescription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Description...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Description</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
