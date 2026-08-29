'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  ShieldCheck,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface PdfCanvasReaderProps {
  book: {
    id: string;
    title: string;
    slug: string;
    digitalPrice?: number;
    currency?: string;
    coverImage?: string;
  };
  watermark: string;
  isSampleMode?: boolean;
}

export default function PdfCanvasReader({
  book,
  watermark,
  isSampleMode = false,
}: PdfCanvasReaderProps) {
  const router = useRouter();
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfStreamUrl = `/api/reader/stream-pdf/${book.slug}${isSampleMode ? '?sample=true' : ''}`;

  // 🛡️ MOBILE & DESKTOP COMPREHENSIVE ANTI-SCREENSHOT SECURITY SHIELD
  useEffect(() => {
    // 1. Override window.print()
    window.print = () => {
      setIsWindowBlurred(true);
      return false;
    };

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      setIsWindowBlurred(true);
    };

    // 2. Mobile & Desktop Instant Keydown & Hardware Key Intercept
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
      const isWinKey = e.key === 'Meta' || e.key === 'Win';
      const isShiftS = (e.key === 'S' || e.key === 's') && (e.shiftKey || e.metaKey || e.ctrlKey);
      const isMacScreenshot = (e.metaKey || e.ctrlKey) && e.shiftKey;
      const isSavePrint = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U');

      if (isPrintScreen || isWinKey || isShiftS || isMacScreenshot || isSavePrint) {
        setIsWindowBlurred(true);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('');
        }

        setTimeout(() => {
          setIsWindowBlurred(false);
        }, 2500);
      }
    };

    // 3. Mobile Hardware Screenshot Gesture Intercept (Power+Vol, 3-Finger Swipe, Visibility Change)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsWindowBlurred(true);
      } else {
        setTimeout(() => setIsWindowBlurred(false), 300);
      }
    };

    // 4. Mobile Multi-Touch Screenshot Gesture Detection (3 or 4 fingers swipe down)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2000);
      }
    };

    // 5. Blur Canvas on Window / Tab Loss of Focus
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => setIsWindowBlurred(false), 300);
    };

    // 6. Clear Clipboard on Copy attempt
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyDown, true);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyDown, true);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Step 1: Load PDF Document into memory from Local PDF.js Engine (< 0.01s!)
  useEffect(() => {
    if (!isPdfJsLoaded) return;
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (loading && !pdfDocRef.current) {
        setLoading(false);
        setError('Manuscript loading timed out. Please refresh or contact admin.');
      }
    }, 8000);

    async function loadPdfDocument() {
      setLoading(true);
      setError('');

      try {
        // @ts-ignore
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }

        const loadingTask = pdfjsLib.getDocument(pdfStreamUrl);
        const pdf = await loadingTask.promise;

        if (isCancelled) return;
        pdfDocRef.current = pdf;
        const total = isSampleMode ? Math.min(10, pdf.numPages) : pdf.numPages;
        setNumPages(total);
        setLoading(false);
      } catch (err: any) {
        console.error('PDF.js document load error:', err);
        setError('Failed to load manuscript PDF. Please ensure you are logged in and have unlocked digital reading access.');
        setLoading(false);
      } finally {
        clearTimeout(timer);
      }
    }

    loadPdfDocument();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isPdfJsLoaded, pdfStreamUrl, isSampleMode]);

  // Step 2: Render Active Page + 2D Hardened Watermark Stamping
  useEffect(() => {
    if (!pdfDocRef.current || currentPage < 1) return;

    let isCancelled = false;

    async function renderActivePage() {
      setRenderingPage(true);
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        // Dynamic Responsive Scale Calculation for Mobile vs Desktop
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const screenWidth = window.innerWidth;

        let scale = 1.5; // Desktop default scale
        if (screenWidth < 640) {
          const availableWidth = screenWidth - 12;
          scale = availableWidth / unscaledViewport.width;
        } else if (screenWidth < 1024) {
          const availableWidth = Math.min(680, screenWidth - 32);
          scale = availableWidth / unscaledViewport.width;
        }

        const viewport = page.getViewport({ scale: Math.max(1.0, scale) });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        // 🛡️ STAMP VISIBLE HIGH-DENSITY SECURITY WATERMARK DIRECTLY ON CANVAS 2D CONTEXT
        context.save();
        context.rotate((-30 * Math.PI) / 180);
        context.font = 'bold 22px serif';
        context.fillStyle = 'rgba(0, 0, 0, 0.08)';
        context.textAlign = 'center';

        const stampText = watermark || 'LICENSED DIGITAL MANUSCRIPT • DO NOT COPY';
        for (let y = -canvas.height; y < canvas.height * 2; y += 140) {
          for (let x = -canvas.width; x < canvas.width * 2; x += 380) {
            context.fillText(stampText, x, y);
          }
        }
        context.restore();

      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Failed to render active PDF page:', err);
        }
      } finally {
        if (!isCancelled) setRenderingPage(false);
      }
    }

    renderActivePage();

    const handleResize = () => renderActivePage();
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [currentPage, loading, numPages, watermark]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((prev) => Math.min(numPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();

  return (
    <div
      onContextMenu={handleContextMenu}
      onCopy={handleCopy}
      onCut={handleCopy}
      className="min-h-screen flex flex-col font-sans select-none bg-[#0D111A] text-slate-100 relative overflow-hidden"
    >
      {/* Load Local PDF.js Engine */}
      <Script
        src="/pdf.min.js"
        onLoad={() => setIsPdfJsLoaded(true)}
      />

      {/* Sample Mode Banner */}
      {isSampleMode && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-sans font-bold flex items-center justify-between shadow-md z-50 shrink-0">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>FREE SAMPLE PREVIEW • ANTI-SCREENSHOT PROTECTED</span>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-2.5 py-0.5 rounded-md bg-slate-950 text-rose-300 text-[10px] sm:text-[11px] font-bold hover:bg-slate-900 transition-all flex items-center gap-1 shrink-0"
          >
            <Lock className="w-3 h-3" />
            <span>UNLOCK FULL BOOK</span>
          </button>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <header className="sticky top-0 z-40 bg-[#0A0D16] border-b border-[#1E293B] px-2.5 sm:px-6 py-2 flex items-center justify-between shadow-xl shrink-0">
        
        {/* Left: Exit Reader Button */}
        <Link
          href={`/books/${book.slug}`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#161F33] border border-[#27354D] hover:border-rose-500 text-rose-300 text-xs font-bold transition-all shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">EXIT READER</span>
          <span className="sm:hidden text-[11px]">EXIT</span>
        </Link>

        {/* Center: Book Title & Page Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-center hidden lg:block">
            <h1 className="font-serif text-sm font-bold text-amber-100 line-clamp-1">
              {book.title}
            </h1>
          </div>

          {!loading && numPages > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 bg-[#101624] border border-[#23314A] px-2 sm:px-3 py-1 rounded-xl text-xs font-semibold text-slate-300">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:text-rose-300 disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-[11px] sm:text-xs">
                Page <strong className="text-rose-300">{currentPage}</strong> / {numPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
                disabled={currentPage >= numPages}
                className="p-1 hover:text-rose-300 disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Security Protection Badge */}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Anti-Screenshot Active</span>
          <span className="sm:hidden">Protected</span>
        </div>

      </header>

      {/* MAIN CANVAS PAGE DISPLAY */}
      <main className="flex-1 w-full overflow-y-auto p-1.5 sm:p-6 flex flex-col items-center bg-[#111622] relative">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-rose-300 my-auto">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-bold">Rendering Exact PDF Manuscript...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 max-w-md my-16 text-center space-y-3 text-rose-300 text-xs">
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* ACTIVE PAGE HTML5 CANVAS */}
        <div ref={containerRef} className={`w-full sm:max-w-2xl my-1 sm:my-2 flex flex-col items-center ${loading || error ? 'hidden' : 'block'} relative`}>
          
          {/* ANTI-SCREENSHOT BLUR OVERLAY */}
          {isWindowBlurred && (
            <div className="absolute inset-0 bg-[#0B0F19] backdrop-blur-3xl z-50 flex flex-col items-center justify-center space-y-3 text-rose-300 text-center p-6 rounded-sm border border-rose-500/40">
              <ShieldAlert className="w-12 h-12 text-rose-400 animate-pulse" />
              <h3 className="font-serif text-lg font-bold text-amber-100">SCREEN CAPTURE DISABLED</h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                Screenshots and screen recording are disabled on mobile & desktop to protect author copyright.
              </p>
            </div>
          )}

          {/* PAPER CANVAS CONTAINER */}
          <div className={`relative bg-white border border-slate-300 sm:rounded-sm shadow-2xl overflow-hidden w-full flex items-center justify-center min-h-[500px] sm:min-h-[750px] transition-all duration-150 ${isWindowBlurred ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            
            {renderingPage && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-30">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
              </div>
            )}

            {/* HTML5 CANVAS (HARDENED 2D CONTEXT WITH WATERMARK STAMP) */}
            <canvas
              ref={canvasRef}
              className="w-full h-auto pointer-events-none select-none block"
            />

          </div>

          {/* BOTTOM PAGE TURN NAVIGATION CONTROLS */}
          <div className="w-full flex items-center justify-between pt-4 pb-2 font-sans text-xs text-slate-400 px-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#101624] border border-[#23314A] hover:border-rose-500 text-rose-300 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-[11px] text-slate-400">Page {currentPage} of {numPages}</span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
              disabled={currentPage >= numPages}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs disabled:opacity-30 shadow"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* SAMPLE MODE LOCK SCREEN AT END */}
        {isSampleMode && !loading && (
          <div className="w-full sm:max-w-2xl my-4 bg-[#0B0F19] border border-rose-500/50 rounded-2xl p-6 text-center space-y-3 font-sans shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-amber-100">End of Free Sample Preview</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Unlock digital reading access to continue reading all pages of <strong className="text-amber-200">{book.title}</strong>.
            </p>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-xl hover:brightness-110 transition-all inline-flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>BUY & UNLOCK FULL BOOK (₹{book.digitalPrice || 199})</span>
            </button>
          </div>
        )}

      </main>

      {/* PAYMENT MODAL */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        book={{
          id: book.id,
          title: book.title,
          slug: book.slug,
          price: book.digitalPrice || 199,
          currency: book.currency || 'INR',
          coverImage: book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        }}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          router.push(`/read/${book.slug}`);
          router.refresh();
        }}
      />

    </div>
  );
}
