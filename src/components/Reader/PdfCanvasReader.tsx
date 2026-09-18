'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Moon,
  Sun,
  BookMarked,
  Bookmark,
  Star,
  Trash2,
  X,
  BookOpen,
  ArrowDownUp,
  LayoutGrid,
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
  watermark?: string;
  initialProgress?: {
    chapterId?: string | null;
    pageNumber?: number | null;
    positionPercent?: number;
  } | null;
  isSampleMode?: boolean;
}

interface SavedBookmark {
  id?: string;
  pageNumber: number;
  positionPercent?: number;
  createdAt?: string;
}

export default function PdfCanvasReader({
  book,
  watermark,
  initialProgress,
  isSampleMode = false,
}: PdfCanvasReaderProps) {
  const router = useRouter();
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const existingLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
      if (existingLib) {
        existingLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        return true;
      }
    }
    return false;
  });

  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);

  // Fast PDF.js loader & poller
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already available on window
    // @ts-ignore
    const checkExisting = () => window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
    const existing = checkExisting();
    if (existing) {
      existing.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      setIsPdfJsLoaded(true);
      return;
    }

    // Poller in case script tag is currently loading from layout
    const pollInterval = setInterval(() => {
      const lib = checkExisting();
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        setIsPdfJsLoaded(true);
        clearInterval(pollInterval);
      }
    }, 40);

    const script = document.createElement('script');
    script.src = '/pdf.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      const pdfjsLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      }
      setIsPdfJsLoaded(true);
      clearInterval(pollInterval);
    };
    script.onerror = () => {
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      cdnScript.async = true;
      cdnScript.onload = () => {
        // @ts-ignore
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        setIsPdfJsLoaded(true);
        clearInterval(pollInterval);
      };
      cdnScript.onerror = () => {
        setError('Failed to load PDF reading engine. Please refresh.');
        setLoading(false);
        clearInterval(pollInterval);
      };
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(script);

    return () => clearInterval(pollInterval);
  }, []);

  // Current Reading Page State
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`storyvault_page_${book.slug}`);
      if (saved) {
        const p = parseInt(saved, 10);
        if (!isNaN(p) && p >= 1) return p;
      }
    }
    if (initialProgress?.pageNumber && initialProgress.pageNumber >= 1) {
      return initialProgress.pageNumber;
    }
    return 1;
  });

  // Reading Style Mode: 'horizontal' (page flip) | 'vertical' (continuous stream)
  const [readingMode, setReadingMode] = useState<'horizontal' | 'vertical'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('storyvault_reading_mode') as 'horizontal' | 'vertical';
      if (saved === 'horizontal' || saved === 'vertical') return saved;
    }
    return 'horizontal';
  });

  // Multiple Favourite Pages / Bookmarks State
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const localList = localStorage.getItem(`storyvault_bookmarks_${book.slug}`);
        if (localList) return JSON.parse(localList);
      } catch (e) {}
    }
    return [];
  });

  const [isBookmarkDrawerOpen, setIsBookmarkDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isDocumentLoadedRef = useRef(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Reader Customization & View Controls
  const [themeMode, setThemeMode] = useState<'white' | 'sepia' | 'dark'>('white');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState({ width: 680, height: 1051 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(() => String(currentPage || 1));

  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Touch Swipe Refs
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);

  const pdfStreamUrl = `/api/reader/stream-pdf/${book.slug}${isSampleMode ? '?sample=true' : ''}`;

  // Fetch bookmarks from API on mount
  useEffect(() => {
    if (isSampleMode) return;
    async function loadBookmarks() {
      try {
        const res = await fetch(`/api/reader/bookmark?bookId=${book.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.bookmarks)) {
            const formatted: SavedBookmark[] = data.bookmarks.map((b: any) => ({
              id: b.id,
              pageNumber: b.pageNumber,
              positionPercent: b.positionPercent,
              createdAt: b.createdAt,
            }));
            setBookmarks(formatted);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`storyvault_bookmarks_${book.slug}`, JSON.stringify(formatted));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    }
    loadBookmarks();
  }, [book.id, book.slug, isSampleMode]);

  // Save reading mode preference
  const handleReadingModeChange = (mode: 'horizontal' | 'vertical') => {
    setReadingMode(mode);
    setIsHeaderVisible(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('storyvault_reading_mode', mode);
    }
    setToastMessage(`Switched to ${mode === 'horizontal' ? 'Page Flip (Horizontal)' : 'Continuous Scroll (Vertical)'} mode`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Scroll direction listener for vertical mode: Scroll DOWN -> Show Header, Scroll UP -> Disappear
  useEffect(() => {
    if (readingMode !== 'vertical') {
      setIsHeaderVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = mainScrollRef.current ? mainScrollRef.current.scrollTop : window.scrollY;
      const diff = scrollY - lastScrollYRef.current;

      if (Math.abs(diff) > 8) {
        if (scrollY <= 60) {
          setIsHeaderVisible(true);
        } else if (diff > 0) {
          // Scrolling down -> show header
          setIsHeaderVisible(true);
        } else if (diff < 0) {
          // Scrolling up -> disappear
          setIsHeaderVisible(false);
        }
        lastScrollYRef.current = scrollY;
      }
    };

    const mainEl = mainScrollRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [readingMode]);

  // Check if current page is bookmarked
  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  // Toggle Bookmark for any specific page number (used across horizontal and vertical modes)
  const handleToggleBookmarkPage = async (pageNum: number) => {
    if (pageNum < 1) return;
    const exists = bookmarks.some((b) => b.pageNumber === pageNum);

    let updatedList: SavedBookmark[];
    const positionPercent = numPages > 0 ? Math.min(100, Math.max(1, Math.round((pageNum / numPages) * 100))) : 1;

    if (exists) {
      updatedList = bookmarks.filter((b) => b.pageNumber !== pageNum);
      setToastMessage(`Removed Page ${pageNum} from Bookmarks`);
    } else {
      const newBm: SavedBookmark = {
        pageNumber: pageNum,
        positionPercent,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...bookmarks, newBm].sort((a, b) => a.pageNumber - b.pageNumber);
      setToastMessage(`🔖 Bookmarked Page ${pageNum} (${positionPercent}%)`);
    }

    setBookmarks(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`storyvault_bookmarks_${book.slug}`, JSON.stringify(updatedList));
      localStorage.setItem(`storyvault_page_${book.slug}`, String(pageNum));
    }
    setTimeout(() => setToastMessage(null), 2500);

    // Sync to backend
    try {
      await fetch('/api/reader/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          pageNumber: pageNum,
          positionPercent,
          action: exists ? 'remove' : 'add',
        }),
      });
    } catch (e) {}
  };

  // Toggle Bookmark on Current Active Page
  const handleToggleBookmark = async () => {
    handleToggleBookmarkPage(currentPage);
  };

  // Delete a specific bookmark
  const handleDeleteBookmark = async (pageNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = bookmarks.filter((b) => b.pageNumber !== pageNum);
    setBookmarks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`storyvault_bookmarks_${book.slug}`, JSON.stringify(updated));
    }

    try {
      await fetch(`/api/reader/bookmark?bookId=${book.id}&pageNumber=${pageNum}`, {
        method: 'DELETE',
      });
    } catch (err) {}
  };

  // Jump to specific bookmarked page
  const handleJumpToBookmark = (pageNum: number) => {
    setCurrentPage(pageNum);
    setIsBookmarkDrawerOpen(false);
    setToastMessage(`Jumped to Bookmark on Page ${pageNum}`);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Touch Swipe & Pinch Zoom Support for Mobile Readers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 1) {
        touchStartXRef.current = e.touches[0].clientX;
      } else if (e.touches && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchDistanceRef.current = dist;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 2 && touchDistanceRef.current !== null) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (currentDist - touchDistanceRef.current) / 200;
        if (Math.abs(delta) > 0.03) {
          setZoomLevel((z) => Math.min(2.5, Math.max(0.6, Number((z + delta).toFixed(2)))));
          touchDistanceRef.current = currentDist;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchDistanceRef.current = null;
      if (e.changedTouches && e.changedTouches.length === 1 && readingMode === 'horizontal') {
        touchEndXRef.current = e.changedTouches[0].clientX;
        const diff = touchStartXRef.current - touchEndXRef.current;
        if (Math.abs(diff) > 55) {
          if (diff > 0) {
            setCurrentPage((prev) => Math.min(numPages, prev + 1));
          } else {
            setCurrentPage((prev) => Math.max(1, prev - 1));
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [numPages, readingMode]);

  // Step 1: Load PDF Document into memory
  useEffect(() => {
    if (!isPdfJsLoaded) return;
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (loading && !pdfDocRef.current) {
        setLoading(false);
        setError('Manuscript loading timed out. Please refresh or contact admin.');
      }
    }, 10000);

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
        const total = pdf.numPages;
        setNumPages(total);

        // Resume reading position
        let targetPage = 1;
        let resumeReason = '';
        if (!isSampleMode) {
          const savedLocalPage = typeof window !== 'undefined' ? localStorage.getItem(`storyvault_page_${book.slug}`) : null;
          const parsedLocal = savedLocalPage ? parseInt(savedLocalPage, 10) : null;

          if (parsedLocal && !isNaN(parsedLocal) && parsedLocal >= 1 && parsedLocal <= total) {
            targetPage = parsedLocal;
            resumeReason = `📖 Resumed reading at Page ${parsedLocal}`;
          } else if (initialProgress?.pageNumber && initialProgress.pageNumber >= 1 && initialProgress.pageNumber <= total) {
            targetPage = initialProgress.pageNumber;
            resumeReason = `📖 Resumed reading at Page ${initialProgress.pageNumber}`;
          }
        }

        isDocumentLoadedRef.current = true;
        setCurrentPage(targetPage);
        setJumpPageInput(String(targetPage));
        setLoading(false);

        if (resumeReason && targetPage > 1) {
          setToastMessage(resumeReason);
          setTimeout(() => setToastMessage(null), 3500);
        }
      } catch (err: any) {
        console.error('PDF.js document load error:', err);
        setError('Failed to load manuscript PDF. Please ensure you are logged in.');
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
  }, [isPdfJsLoaded, pdfStreamUrl, isSampleMode, book.slug]);

  // Step 2: Render Single Active Page for Horizontal Mode
  const renderActivePage = useCallback(async () => {
    if (!pdfDocRef.current || currentPage < 1) return;

    setRenderingPage(true);

    const visibleCanvas = canvasRef.current;
    if (!visibleCanvas) return;

    try {
      const page = await pdfDocRef.current.getPage(currentPage);

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }

      // Responsive Scale Calculation
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      let baseWidth = 640;
      if (screenWidth < 480) {
        baseWidth = Math.max(280, screenWidth - 24);
      } else if (screenWidth < 768) {
        baseWidth = screenWidth - 36;
      } else if (screenWidth < 1024) {
        baseWidth = Math.min(680, screenWidth - 48);
      } else if (screenWidth < 1536) {
        baseWidth = Math.min(760, Math.round(screenWidth * 0.54));
      } else {
        baseWidth = Math.min(840, Math.round(screenWidth * 0.44));
      }

      const baseScale = baseWidth / unscaledViewport.width;
      const baseHeight = unscaledViewport.height * baseScale;
      setPageDimensions({ width: baseWidth, height: baseHeight });

      const dpr = typeof window !== 'undefined' ? Math.max(1.5, Math.min(2.5, window.devicePixelRatio || 1)) : 2;
      const finalScale = baseScale * zoomLevel * dpr;
      const viewport = page.getViewport({ scale: finalScale });

      // Render onto offscreen canvas for smooth flicker-free presentation
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const renderTask = page.render({ canvasContext: offCtx, viewport });
      renderTaskRef.current = renderTask;

      await renderTask.promise;

      // Display on visible canvas
      visibleCanvas.width = offscreen.width;
      visibleCanvas.height = offscreen.height;
      const finalCtx = visibleCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.drawImage(offscreen, 0, 0);
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Failed to render active PDF page:', err);
      }
    } finally {
      setRenderingPage(false);
    }
  }, [currentPage, zoomLevel, themeMode]);

  // Trigger page render when page, zoom, or theme changes
  useEffect(() => {
    if (readingMode === 'horizontal') {
      renderActivePage();
    }
    setJumpPageInput(String(currentPage));

    // Save progress to localStorage
    if (typeof window !== 'undefined' && currentPage >= 1) {
      localStorage.setItem(`storyvault_page_${book.slug}`, String(currentPage));
      if (numPages > 0) {
        const positionPercent = Math.min(100, Math.max(1, Math.round((currentPage / numPages) * 100)));
        localStorage.setItem(`storyvault_percent_${book.slug}`, String(positionPercent));
      }
    }

    // Auto save progress to DB
    if (!isSampleMode && numPages > 0 && currentPage >= 1) {
      const positionPercent = Math.min(100, Math.max(1, Math.round((currentPage / numPages) * 100)));
      fetch('/api/reader/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          bookId: book.id,
          pageNumber: currentPage,
          positionPercent,
        }),
      }).catch(() => {});
    }
  }, [currentPage, zoomLevel, themeMode, readingMode, renderActivePage, isSampleMode, numPages, book.id, book.slug]);

  // Debounced Resize handler
  useEffect(() => {
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (readingMode === 'horizontal') {
          renderActivePage();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [renderActivePage, readingMode]);

  // Keyboard Shortcuts for page flipping and zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (readingMode === 'horizontal') {
          e.preventDefault();
          setCurrentPage((prev) => Math.min(numPages, prev + 1));
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (readingMode === 'horizontal') {
          e.preventDefault();
          setCurrentPage((prev) => Math.max(1, prev - 1));
        }
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBookmark();
      } else if (e.key === '+' || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(2))));
      } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, readingMode, bookmarks, currentPage]);

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleJumpPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      if (readingMode === 'vertical') {
        const el = document.getElementById(`vertical-page-${pageNum}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  return (
    <div
      ref={readerContainerRef}
      className={`h-screen max-h-screen flex flex-col font-sans select-none relative overflow-hidden transition-colors duration-300 ${
        themeMode === 'dark'
          ? 'bg-[#06080E] text-slate-100'
          : themeMode === 'sepia'
          ? 'bg-[#EAE0CA] text-stone-900'
          : 'bg-[#0B0F19] text-slate-100'
      }`}
    >
      {/* Sample Preview Top Alert */}
      {isSampleMode && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1.5 text-[11px] sm:text-xs font-sans font-bold flex items-center justify-between shadow-md z-50 shrink-0">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>FREE SAMPLE PREVIEW</span>
          </div>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-3 py-1 rounded-md bg-slate-950 text-rose-300 text-[10px] sm:text-[11px] font-bold hover:bg-slate-900 transition-all flex items-center gap-1 shrink-0"
          >
            <Lock className="w-3 h-3 text-rose-400" />
            <span>UNLOCK FULL BOOK (₹{book.digitalPrice || 199})</span>
          </button>
        </div>
      )}

      {/* TOP HEADER CONTROLS BAR */}
      <header className={`sticky top-0 z-40 bg-[#080C14]/95 backdrop-blur-xl border-b border-[#1E293E] px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0 gap-2 transition-all duration-300 ${
        readingMode === 'vertical' && !isHeaderVisible
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}>
        
        {/* Left: Exit Reader & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/books/${book.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141C2E] border border-[#26354D] hover:border-rose-500 text-rose-300 text-xs font-bold transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">EXIT READER</span>
            <span className="sm:hidden text-[11px]">EXIT</span>
          </Link>

          <h1 className="font-serif text-xs sm:text-sm font-bold text-rose-100 line-clamp-1 max-w-[130px] sm:max-w-xs hidden md:block">
            {book.title}
          </h1>
        </div>

        {/* Center: Pagination & Page Jump (Horizontal Mode) */}
        {!loading && numPages > 0 && (
          <div className="flex items-center gap-1 sm:gap-2 bg-[#0E1422] border border-[#222E44] px-2 sm:px-3 py-1 rounded-xl text-xs font-semibold text-slate-300 shadow-inner">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:text-rose-300 disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Jump to Page Form */}
            <form onSubmit={handleJumpPageSubmit} className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">Page</span>
              <input
                id="reader-jump-page-input"
                name="jumpPage"
                aria-label="Jump to page number"
                type="text"
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onBlur={handleJumpPageSubmit}
                className="w-9 text-center bg-[#080C14] border border-[#273650] rounded px-1 py-0.5 text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-400">/ {numPages}</span>
            </form>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
              disabled={currentPage >= numPages}
              className="p-1 hover:text-rose-300 disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Reading Mode, Bookmarks, Theme & Zoom */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Reading Style Mode Switcher (Horizontal vs Vertical) */}
          <div className="flex items-center bg-[#0E1422] border border-[#1E293E] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => handleReadingModeChange('horizontal')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                readingMode === 'horizontal'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-200'
              }`}
              title="Page Flip (Horizontal) Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">FLIP</span>
            </button>
            <button
              onClick={() => handleReadingModeChange('vertical')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                readingMode === 'vertical'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-200'
              }`}
              title="Continuous Scroll (Vertical) Mode"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">SCROLL</span>
            </button>
          </div>

          {/* Bookmarks Drawer Toggle Button */}
          <button
            onClick={() => setIsBookmarkDrawerOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-[#0E1422] border border-[#232E44] text-rose-300 hover:border-rose-500/60 hover:bg-rose-500/10 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="View Saved Bookmarks"
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">BOOKMARKS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-200 font-mono font-bold">
              {bookmarks.length}
            </span>
          </button>

          {/* Bookmark Current Page Button */}
          <button
            onClick={handleToggleBookmark}
            className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 shadow-sm shrink-0 cursor-pointer ${
              isCurrentPageBookmarked
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-rose-400 shadow-rose-500/30'
                : 'bg-[#0E1422] border-[#232E44] text-slate-300 hover:border-rose-500/70 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
            title={isCurrentPageBookmarked ? 'Page is bookmarked. Click to remove.' : 'Bookmark current page'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-white text-white' : 'text-rose-400'}`} />
            <span className="hidden md:inline">
              {isCurrentPageBookmarked ? `BOOKMARKED (P. ${currentPage})` : 'BOOKMARK PAGE'}
            </span>
            <span className="md:hidden text-[11px]">
              {isCurrentPageBookmarked ? `P.${currentPage}` : 'SAVE'}
            </span>
          </button>

          {/* Theme Modes Selector */}
          <div className="hidden sm:flex items-center bg-[#0E1422] border border-[#1E293E] p-1 rounded-xl gap-1">
            <button
              onClick={() => setThemeMode('white')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                themeMode === 'white' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Crisp White Paper Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeMode('sepia')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                themeMode === 'sepia' ? 'bg-[#D9CEB2] text-amber-950 font-bold shadow' : 'text-slate-400 hover:text-amber-300'
              }`}
              title="Warm Sepia Parchment Mode"
            >
              <BookMarked className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                themeMode === 'dark' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-rose-300'
              }`}
              title="Midnight Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls (Horizontal Mode) */}
          {readingMode === 'horizontal' && (
            <div className="hidden md:flex items-center bg-[#0E1422] border border-[#1E293E] px-1 py-1 rounded-xl gap-1 text-slate-400">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
                className="p-1 hover:text-rose-300 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded hover:bg-[#1E293E] hover:text-rose-200 transition-colors cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(2))))}
                className="p-1 hover:text-rose-300 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#0E1422] border border-[#1E293E] text-slate-300 hover:text-rose-300 transition-all hidden sm:block cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

        </div>

      </header>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#0E1422]/95 border border-rose-500/80 px-5 py-2.5 rounded-2xl shadow-2xl shadow-rose-500/20 text-rose-100 text-xs font-bold flex items-center gap-2 backdrop-blur-xl animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BOOKMARKS DRAWER / MODAL */}
      {isBookmarkDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-[#0C111D] border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl animate-slide-left">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-rose-400 fill-rose-400" />
                  <h2 className="font-serif text-lg font-bold text-rose-100">Saved Bookmarks</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 font-mono font-bold">
                    {bookmarks.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsBookmarkDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Quickly jump to any of your saved bookmarked pages in <strong className="text-rose-200">{book.title}</strong>.
              </p>

              {bookmarks.length > 0 ? (
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {bookmarks.map((b) => (
                    <div
                      key={b.pageNumber}
                      onClick={() => handleJumpToBookmark(b.pageNumber)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        b.pageNumber === currentPage
                          ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/15'
                          : 'bg-[#111726] border-white/5 hover:border-rose-500/40 hover:bg-[#161E30]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          b.pageNumber === currentPage
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/5 text-rose-300'
                        }`}>
                          {b.pageNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-200">
                            Page {b.pageNumber}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {b.positionPercent ? `${b.positionPercent}% through story` : `Saved page`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteBookmark(b.pageNumber, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Bookmark className="w-10 h-10 text-slate-600 mx-auto opacity-40" />
                  <p className="text-xs text-slate-400">No bookmarks saved yet.</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Click the bookmark ribbon or "Bookmark Page" button while reading to save pages here.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={handleToggleBookmark}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 fill-white" />
                <span>{isCurrentPageBookmarked ? `Remove Bookmark (Page ${currentPage})` : `Bookmark Current Page (Page ${currentPage})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CANVAS PAGE DISPLAY */}
      <main ref={mainScrollRef} className="flex-1 w-full overflow-x-hidden overflow-y-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 flex flex-col items-center relative">

        {/* MODE A: HORIZONTAL (SINGLE PAGE FLIP) */}
        {readingMode === 'horizontal' && (
          <div
            ref={containerRef}
            style={{
              width: `${Math.round(pageDimensions.width * zoomLevel)}px`,
              maxWidth: zoomLevel <= 1.0 ? '100%' : 'none',
            }}
            className="my-1 sm:my-2 flex flex-col items-center transition-all duration-150 relative shrink-0 max-w-full"
          >
            {/* Skeleton Loading State */}
            {(loading || error) && (
              <div
                className={`w-full rounded-sm border ${
                  themeMode === 'sepia'
                    ? 'border-stone-400 bg-[#F0E8D0]'
                    : themeMode === 'dark'
                    ? 'border-[#1E293E] bg-[#0C1119]'
                    : 'border-slate-300 bg-white'
                } flex items-center justify-center`}
                style={{ aspectRatio: '680 / 1051' }}
              >
                {loading && (
                  <div className="flex flex-col items-center gap-3 text-rose-300">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                    <p className="text-xs font-bold tracking-wider uppercase">Loading Manuscript...</p>
                  </div>
                )}
                {error && (
                  <div className="p-6 text-center space-y-2 text-rose-300 text-xs max-w-xs">
                    <p className="font-bold">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* PAPER CANVAS CONTAINER WITH APPLIED THEME */}
            <div
              className={`relative border shadow-2xl rounded-sm overflow-hidden w-full flex items-center justify-center ${
                themeMode === 'sepia'
                  ? 'reader-theme-sepia border-stone-400'
                  : themeMode === 'dark'
                  ? 'reader-theme-dark border-[#1E293E]'
                  : 'reader-theme-white bg-white border-slate-300'
              } ${loading || error ? 'hidden' : ''}`}
              style={{
                minHeight: `${Math.round(pageDimensions.height * zoomLevel)}px`,
              }}
            >
              {/* REALISTIC SATIN RIBBON BOOKMARK HANGING OVER PAGE */}
              <div
                onClick={handleToggleBookmark}
                className="absolute top-0 right-6 z-30 cursor-pointer group flex flex-col items-center select-none"
                title={isCurrentPageBookmarked ? `Remove Bookmark (Page ${currentPage})` : `Bookmark Page ${currentPage}`}
              >
                <div
                  className={`w-7 sm:w-8 h-12 sm:h-14 shadow-2xl transition-all duration-300 relative flex items-center justify-center ${
                    isCurrentPageBookmarked
                      ? 'bg-gradient-to-b from-rose-600 via-rose-500 to-rose-700 shadow-rose-500/50 translate-y-0'
                      : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 opacity-40 hover:opacity-100 hover:from-rose-600 hover:to-rose-700 -translate-y-3 group-hover:translate-y-0'
                  }`}
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)',
                  }}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      isCurrentPageBookmarked ? 'text-amber-200 fill-amber-200' : 'text-slate-300 fill-transparent'
                    }`}
                  />
                </div>
              </div>

              {/* CANVAS WRAPPER */}
              <div ref={canvasWrapperRef} className="relative w-full opacity-100">
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                  className="pointer-events-none select-none"
                />
              </div>
            </div>

            {/* BOTTOM PAGE TURN NAVIGATION CONTROLS (BALANCED & RESPONSIVE) */}
            {!loading && !error && (
              <div className="w-full flex items-center justify-between gap-3 pt-5 pb-3 font-sans text-xs text-slate-400 px-1 max-w-full">
                {/* Previous Page Button */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#0E1422] border border-[#222E44] hover:border-rose-500 text-rose-300 text-xs font-bold disabled:opacity-30 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Centered Page Progress Indicator */}
                <div className="flex flex-col items-center text-center px-2">
                  <span className="text-xs sm:text-sm text-slate-200 font-mono font-bold">
                    Page {currentPage} of {numPages}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Math.round((currentPage / (numPages || 1)) * 100)}% completed
                  </span>
                </div>

                {/* Next Page Button */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
                  disabled={currentPage >= numPages}
                  aria-label="Next page"
                  className="flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs disabled:opacity-30 shadow-md shadow-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: VERTICAL (CONTINUOUS STREAM SCROLL) */}
        {readingMode === 'vertical' && (
          <VerticalPdfStream
            pdfDoc={pdfDocRef.current}
            numPages={numPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            themeMode={themeMode}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmarkPage}
          />
        )}

        {/* SAMPLE MODE UNLOCK CALLOUT AT END */}
        {isSampleMode && !loading && (
          <div className="w-full sm:max-w-2xl my-6 bg-[#0E1422] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 font-sans shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-100">End of Free Sample Preview</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Unlock instant digital reading access to continue reading all chapters of <strong className="text-rose-200">{book.title}</strong> anytime in your library.
            </p>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/30 hover:brightness-110 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>BUY & UNLOCK FULL DIGITAL ACCESS (₹{book.digitalPrice || 199})</span>
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

// Sub-component for Vertical Continuous Scroll Mode
function VerticalPdfStream({
  pdfDoc,
  numPages,
  currentPage,
  setCurrentPage,
  themeMode,
  bookmarks,
  onToggleBookmark,
}: {
  pdfDoc: any;
  numPages: number;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  themeMode: 'white' | 'sepia' | 'dark';
  bookmarks: SavedBookmark[];
  onToggleBookmark: (pageNum: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!pdfDoc || numPages <= 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-rose-300">
        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
        <p className="text-xs font-bold uppercase tracking-wider">Preparing continuous scroll stream...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-3xl space-y-6 pb-16 flex flex-col items-center">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <VerticalPageItem
          key={pageNum}
          pageNum={pageNum}
          pdfDoc={pdfDoc}
          themeMode={themeMode}
          isBookmarked={bookmarks.some((b) => b.pageNumber === pageNum)}
          onVisible={() => setCurrentPage(pageNum)}
          onToggleBookmark={() => onToggleBookmark(pageNum)}
        />
      ))}
    </div>
  );
}

// Individual Lazy-Rendered Page Item in Continuous Scroll
function VerticalPageItem({
  pageNum,
  pdfDoc,
  themeMode,
  isBookmarked,
  onVisible,
  onToggleBookmark,
}: {
  pageNum: number;
  pdfDoc: any;
  themeMode: 'white' | 'sepia' | 'dark';
  isBookmarked: boolean;
  onVisible: () => void;
  onToggleBookmark: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible();
            if (!rendered && pdfDoc) {
              renderPageCanvas();
            }
          }
        });
      },
      { rootMargin: '300px 0px 300px 0px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [pdfDoc, rendered]);

  const renderPageCanvas = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1.0 });

      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      let baseWidth = Math.min(760, screenWidth - 32);

      const baseScale = baseWidth / unscaled.width;
      const dpr = typeof window !== 'undefined' ? Math.max(1.5, Math.min(2.0, window.devicePixelRatio || 1)) : 1.5;
      const viewport = page.getViewport({ scale: baseScale * dpr });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport }).promise;

      setRendered(true);
    } catch (e) {}
  };

  return (
    <div
      id={`vertical-page-${pageNum}`}
      ref={containerRef}
      className={`w-full relative rounded-sm shadow-xl border overflow-hidden transition-all ${
        themeMode === 'sepia'
          ? 'reader-theme-sepia border-stone-400 bg-[#F0E8D0]'
          : themeMode === 'dark'
          ? 'reader-theme-dark border-[#1E293E] bg-[#0C1119]'
          : 'reader-theme-white bg-white border-slate-300'
      }`}
      style={{ minHeight: '400px' }}
    >
      {/* Page Number Pill Badge */}
      <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-mono backdrop-blur-sm">
        P. {pageNum}
      </div>

      {/* REALISTIC SATIN RIBBON BOOKMARK FOR VERTICAL MODE */}
      <div
        onClick={onToggleBookmark}
        className="absolute top-0 right-4 sm:right-6 z-30 cursor-pointer group flex flex-col items-center select-none"
        title={isBookmarked ? `Remove Bookmark (Page ${pageNum})` : `Bookmark Page ${pageNum}`}
      >
        <div
          className={`w-6 sm:w-7 h-11 sm:h-13 shadow-2xl transition-all duration-300 relative flex items-center justify-center ${
            isBookmarked
              ? 'bg-gradient-to-b from-rose-600 via-rose-500 to-rose-700 shadow-rose-500/50 translate-y-0'
              : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 opacity-30 hover:opacity-100 hover:from-rose-600 hover:to-rose-700 -translate-y-3 group-hover:translate-y-0'
          }`}
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)',
          }}
        >
          <Bookmark
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
              isBookmarked ? 'text-amber-200 fill-amber-200' : 'text-slate-300 fill-transparent'
            }`}
          />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        className="pointer-events-none select-none"
      />
    </div>
  );
}
