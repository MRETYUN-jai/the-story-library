'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    series?: { name: string } | null;
    bookNumber?: number | null;
  };
  isPurchased?: boolean;
}

export default function BookDetailPageClient({
  book,
  isPurchased = false,
}: BookDetailPageClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(isPurchased);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.purchasedBookIds?.includes(book.id)) {
            setIsUnlocked(true);
          }
        }
      });
  }, [book.id]);

  const handleDigitalBuyClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/books/${book.slug}`);
      return;
    }
    if (isUnlocked) {
      router.push(`/read/${book.slug}`);
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

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* TOP SECTION: COVER & BOOK INFO */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-10 shadow-2xl">
          
          {/* Cover Image */}
          <div className="md:col-span-5 flex justify-center">
            <div className="relative aspect-[2/3] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-[#283652] bg-[#05080E]">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              {isUnlocked && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  UNLOCKED
                </div>
              )}
            </div>
          </div>

          {/* Book Summary */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {book.series && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold uppercase tracking-widest">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  {book.series.name} {book.bookNumber ? `• Book ${book.bookNumber}` : ''}
                </div>
              )}

              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-rose-100 tracking-tight">
                {book.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 font-serif italic">
                By <strong className="text-rose-300">Mretyun Jai B</strong> • {book.genre}
              </p>

              <div className="pt-2 border-t border-[#1C2638]">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Synopsis</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Quick Unlocked Banner if user owns it */}
            {isUnlocked && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-rose-100">You Own Digital Access</h4>
                    <p className="text-xs text-rose-300/80">Available in your library anytime</p>
                  </div>
                </div>

                <Link
                  href={`/read/${book.slug}`}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>READ NOW</span>
                </Link>
              </div>
            )}

          </div>

        </div>

        {/* CHOOSE HOW YOU WANT TO EXPERIENCE THIS STORY */}
        <div className="space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl text-rose-100 font-bold tracking-tight">
              CHOOSE HOW YOU WANT TO EXPERIENCE THIS STORY
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select between instant online digital reading or owning a physical printed book
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* OPTION 1: DIGITAL EDITION */}
            <div className="bg-[#0E1422] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    DIGITAL EDITION
                  </span>
                  <span className="font-serif text-2xl font-bold text-rose-300">
                    ₹{book.digitalPrice}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-rose-100">
                  Read Instantly Inside The Story Library
                </h3>

                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Instant access after payment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Read on desktop, tablet, and mobile
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Progress automatically saved
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✓</span> Continue reading anytime in My Library
                  </li>
                </ul>

                {/* Mandatory Disclaimer */}
                <div className="bg-[#080C14] rounded-xl p-3.5 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    &ldquo;Your purchase unlocks online reading access to this book through The Story Library. Downloadable PDF or EPUB files are not provided.&rdquo;
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Free Sample Button */}
                {!isUnlocked && (
                  <Link
                    href={`/read/${book.slug}?sample=true`}
                    className="w-full py-3 px-6 rounded-xl bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span>📖 READ FREE SAMPLE (FIRST CHAPTER / 10 PAGES)</span>
                  </Link>
                )}

                <button
                  onClick={handleDigitalBuyClick}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isUnlocked ? (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>READ FULL BOOK NOW</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>BUY & UNLOCK FULL ACCESS (₹{book.digitalPrice})</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* OPTION 2: PHYSICAL EDITIONS */}
            <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  PHYSICAL EDITIONS
                </span>

                <h3 className="font-serif text-xl font-bold text-slate-200">
                  Own a Printed Copy of this Story
                </h3>

                <p className="text-xs text-slate-400">
                  Physical editions are printed, sold, and fulfilled by official publishing partners.
                </p>

                <div className="space-y-3 pt-2">
                  
                  {/* Paperback Option */}
                  {book.paperbackEnabled && book.paperbackLink && (
                    <div className="bg-[#080C14] rounded-2xl p-4 border border-[#1A2336] flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-rose-200">📖 PAPERBACK</h4>
                        <p className="text-[11px] text-slate-400">Softcover Edition • {book.paperbackPublisher || 'Pothi Publishing (pothi.com)'}</p>
                      </div>

                      <button
                        onClick={() => handlePhysicalClick(book.paperbackLink!, 'Paperback Edition', book.paperbackPublisher || 'Pothi Publishing')}
                        className="py-2 px-3.5 rounded-lg bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <span>BUY PAPERBACK</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hardcover Option */}
                  {book.hardcoverEnabled && book.hardcoverLink && (
                    <div className="bg-[#080C14] rounded-2xl p-4 border border-[#1A2336] flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-rose-200">📕 HARDCOVER</h4>
                        <p className="text-[11px] text-slate-400">Premium Hardcover • {book.hardcoverPublisher || 'Pothi Publishing (pothi.com)'}</p>
                      </div>

                      <button
                        onClick={() => handlePhysicalClick(book.hardcoverLink!, 'Hardcover Edition', book.hardcoverPublisher || 'Pothi Publishing')}
                        className="py-2 px-3.5 rounded-lg bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5"
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
          id: book.id,
          title: book.title,
          slug: book.slug,
          price: book.digitalPrice,
          currency: book.currency,
          coverImage: book.coverImage,
        }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          setIsUnlocked(true);
          router.push(`/read/${book.slug}`);
          router.refresh();
        }}
      />

    </div>
  );
}
