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
  ShieldCheck,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Moon,
  Sun,
  BookMarked,
  Bookmark,
  Sliders,
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
  initialProgress?: {
    chapterId?: string | null;
    pageNumber?: number | null;
    positionPercent?: number;
  } | null;
  isSampleMode?: boolean;
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

  // Resilient PDF.js loader with CDN fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // @ts-ignore
    const existingLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
    if (existingLib) {
      existingLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      setIsPdfJsLoaded(true);
      return;
    }

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
      };
      cdnScript.onerror = () => {
        setError('Failed to load PDF reading engine. Please refresh.');
        setLoading(false);
      };
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(script);
  }, []);

  // Lazy Initialization of Current Page & Bookmark from LocalStorage / InitialProgress
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedBookmark = localStorage.getItem(`storyvault_bookmark_${book.slug}`);
      if (savedBookmark) {
        const p = parseInt(savedBookmark, 10);
        if (!isNaN(p) && p >= 1) return p;
      }
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

  const [bookmarkedPage, setBookmarkedPage] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`storyvault_bookmark_${book.slug}`);
      if (saved) {
        const p = parseInt(saved, 10);
        if (!isNaN(p) && p >= 1) return p;
      }
    }
    return null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isDocumentLoadedRef = useRef(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Reader Controls State
  const [themeMode, setThemeMode] = useState<'white' | 'sepia' | 'dark'>('white');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState({ width: 680, height: 1051 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(() => String(currentPage || 1));
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null); // Direct DOM control — bypasses React batching
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe & Pinch Zoom Refs
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);

  const pdfStreamUrl = `/api/reader/stream-pdf/${book.slug}${isSampleMode ? '?sample=true' : ''}`;

  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // 🛡️ AUTHOR COPYRIGHT, SCREENSHOT DEFENSE & DRM PROTECTION
  useEffect(() => {
    // 1. Override window.print()
    window.print = () => false;

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
    };

    // 2. Disable right-click, selection, drag, and copy
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '⚠️ PROTECTED MANUSCRIPT - StoryVault DRM');
      }
    };

    // 3. Block print, save, devtools and intercept PrintScreen shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintOrSave = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S');
      const isDevTools = e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) || ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'));

      if (isPrintOrSave || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Detect PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        setIsWindowBlurred(true);
        setToastMessage('⚠️ Screen capture is restricted to protect copyrighted manuscripts.');
        setTimeout(() => {
          setIsWindowBlurred(false);
          setToastMessage(null);
        }, 2000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
      }
    };

    // 4. 🛡️ FOCUS LOSS & VIEWPORT EXIT SHIELD
    // When Snipping tool, Alt-Tab, or cursor leaves window bounds, activate shield.
    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && !(e as any).toElement) {
        setIsWindowBlurred(true);
      }
    };

    const handleMouseEnter = () => {
      setIsWindowBlurred(false);
    };

    // 5. Mobile Multi-Touch & Pinch Zoom
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
          setZoomLevel((z) => Math.min(3.0, Math.max(0.5, Number((z + delta).toFixed(2)))));
          touchDistanceRef.current = currentDist;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchDistanceRef.current = null;
      if (e.changedTouches && e.changedTouches.length === 1) {
        touchEndXRef.current = e.changedTouches[0].clientX;
        handleSwipeGesture();
      }
    };

    // 6. Ctrl + Wheel Zoom
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setZoomLevel((z) => Math.min(3.0, Math.max(0.5, Number((z + delta).toFixed(2)))));
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheelZoom, { passive: false });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheelZoom);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Handle Mobile Touch Swipe for Page Flip
  const handleSwipeGesture = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 60;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swiped Left -> Next Page
        setCurrentPage((prev) => Math.min(numPages, prev + 1));
      } else {
        // Swiped Right -> Prev Page
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
    }
  };

  // Toggle Ribbon Bookmark on Current Page
  const handleToggleBookmark = async () => {
    if (currentPage < 1) return;
    const isCurrentlyBookmarked = bookmarkedPage === currentPage;
    const newBookmark = isCurrentlyBookmarked ? null : currentPage;
    setBookmarkedPage(newBookmark);

    if (newBookmark !== null) {
      const positionPercent = numPages > 0 ? Math.min(100, Math.max(1, Math.round((newBookmark / numPages) * 100))) : Math.min(100, Math.max(1, Math.round((newBookmark / 193) * 100)));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`storyvault_bookmark_${book.slug}`, String(newBookmark));
        localStorage.setItem(`storyvault_page_${book.slug}`, String(newBookmark));
        localStorage.setItem(`storyvault_percent_${book.slug}`, String(positionPercent));
      }
      setToastMessage(`🔖 Ribbon Bookmark placed on Page ${newBookmark} (${positionPercent}%)`);
      setTimeout(() => setToastMessage(null), 3500);

      // Sync with cloud
      fetch('/api/reader/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          pageNumber: newBookmark,
          positionPercent,
        }),
      }).catch(() => {});
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`storyvault_bookmark_${book.slug}`);
      }
      setToastMessage(`Bookmark removed from Page ${currentPage}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Step 1: Load PDF Document into memory
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
        const total = pdf.numPages;
        setNumPages(total);

        // Resume reading position: Ribbon Bookmark > localStorage > initialProgress
        let targetPage = 1;
        let resumeReason = '';
        if (!isSampleMode) {
          const savedBookmark = typeof window !== 'undefined' ? localStorage.getItem(`storyvault_bookmark_${book.slug}`) : null;
          const parsedBookmark = savedBookmark ? parseInt(savedBookmark, 10) : null;

          const savedLocalPage = typeof window !== 'undefined' ? localStorage.getItem(`storyvault_page_${book.slug}`) : null;
          const parsedLocal = savedLocalPage ? parseInt(savedLocalPage, 10) : null;

          if (parsedBookmark && !isNaN(parsedBookmark) && parsedBookmark >= 1 && parsedBookmark <= total) {
            targetPage = parsedBookmark;
            resumeReason = `🔖 Resumed from your Ribbon Bookmark on Page ${parsedBookmark}`;
            setBookmarkedPage(parsedBookmark);
          } else if (parsedLocal && !isNaN(parsedLocal) && parsedLocal >= 1 && parsedLocal <= total) {
            targetPage = parsedLocal;
            resumeReason = `📖 Resumed reading at Page ${parsedLocal}`;
          } else if (initialProgress?.pageNumber && initialProgress.pageNumber >= 1 && initialProgress.pageNumber <= total) {
            targetPage = initialProgress.pageNumber;
            resumeReason = `📖 Resumed reading at Page ${initialProgress.pageNumber}`;
          } else if (initialProgress?.positionPercent && initialProgress.positionPercent > 0) {
            targetPage = Math.min(total, Math.max(1, Math.round((initialProgress.positionPercent / 100) * total)));
            resumeReason = `📖 Resumed reading at Page ${targetPage}`;
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
  }, [isPdfJsLoaded, pdfStreamUrl, isSampleMode, book.slug]);

  // Step 2: Render Active Page + 2D Hardened Watermark Stamping
  // 🛡️ ZERO-LATENCY DOM SHIELD: Uses direct ref DOM mutation (not React state) to hide
  // the canvas INSTANTLY — no batching gap, no partial-render screenshot window.
  const renderActivePage = useCallback(async () => {
    if (!pdfDocRef.current || currentPage < 1) return;

    setRenderingPage(true);

    // ⚡ STEP A: INSTANT DOM HIDE — synchronous, zero React batching delay.
    // Canvas wrapper is hidden at the DOM level before ANY async work begins.
    // No screenshot tool can capture canvas content during this state.
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.visibility = 'hidden';
      canvasWrapperRef.current.style.opacity = '0';
    }

    const visibleCanvas = canvasRef.current;

    try {
      const page = await pdfDocRef.current.getPage(currentPage);

      if (!visibleCanvas || !canvasWrapperRef.current) return;

      // Cancel previous render task if active
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }

      // Dynamic Responsive Scale Calculation
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      let baseWidth = 640;
      if (screenWidth < 480) {
        baseWidth = Math.max(300, screenWidth - 20);
      } else if (screenWidth < 768) {
        baseWidth = screenWidth - 32;
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

      const dpr = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 1) : 2;
      const finalScale = baseScale * zoomLevel * dpr;
      const viewport = page.getViewport({ scale: finalScale });

      // ⚡ STEP B: Render into hidden offscreen buffer.
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

      // ⚡ STEP C: Await full render completion into hidden buffer.
      await renderTask.promise;

      // 🛡️ FORENSIC WATERMARK MATRIX stamped onto the offscreen buffer
      const stampText = watermark || 'STORYVAULT • LICENSED DIGITAL MANUSCRIPT';

      offCtx.save();
      offCtx.font = 'bold 12px monospace';
      offCtx.textAlign = 'center';
      offCtx.fillStyle = themeMode === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : themeMode === 'sepia'
        ? 'rgba(120, 53, 15, 0.14)'
        : 'rgba(0, 0, 0, 0.11)';
      offCtx.translate(offscreen.width / 2, offscreen.height / 2);
      offCtx.rotate(-0.38);
      const maxDim = Math.max(offscreen.width, offscreen.height);
      for (let x = -maxDim * 1.3; x < maxDim * 1.3; x += 260) {
        for (let y = -maxDim * 1.3; y < maxDim * 1.3; y += 140) {
          offCtx.fillText(stampText, x, y);
        }
      }
      offCtx.restore();

      offCtx.save();
      offCtx.font = '10px monospace';
      offCtx.textAlign = 'center';
      offCtx.fillStyle = themeMode === 'dark'
        ? 'rgba(255, 255, 255, 0.22)'
        : themeMode === 'sepia'
        ? 'rgba(120, 53, 15, 0.25)'
        : 'rgba(0, 0, 0, 0.18)';
      offCtx.fillText(`STORYVAULT DIGITAL EDITION • ${stampText}`, offscreen.width / 2, 22);
      offCtx.fillText(`PROTECTED MANUSCRIPT • ${stampText} • ALL RIGHTS RESERVED`, offscreen.width / 2, offscreen.height - 14);
      offCtx.restore();

      // ⚡ STEP D: ATOMIC COPY — visibleCanvas goes from hidden to fully-rendered in one frame.
      visibleCanvas.width = offscreen.width;
      visibleCanvas.height = offscreen.height;
      const finalCtx = visibleCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.drawImage(offscreen, 0, 0);
      }

      // ⚡ STEP E: INSTANT DOM REVEAL — show canvas only after content is fully ready.
      canvasWrapperRef.current.style.visibility = 'visible';
      canvasWrapperRef.current.style.opacity = '1';

    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Failed to render active PDF page:', err);
        // Restore visibility on error so user sees error state
        if (canvasWrapperRef.current) {
          canvasWrapperRef.current.style.visibility = 'visible';
          canvasWrapperRef.current.style.opacity = '1';
        }
      }
    } finally {
      setRenderingPage(false);
    }
  }, [currentPage, zoomLevel, themeMode, watermark]);

  useEffect(() => {
    renderActivePage();
    setJumpPageInput(String(currentPage));

    // Save to local storage for instant offline/re-open restoration
    if (typeof window !== 'undefined' && currentPage >= 1) {
      localStorage.setItem(`storyvault_page_${book.slug}`, String(currentPage));
      if (numPages > 0) {
        const positionPercent = Math.min(100, Math.max(1, Math.round((currentPage / numPages) * 100)));
        localStorage.setItem(`storyvault_percent_${book.slug}`, String(positionPercent));
        localStorage.setItem(`storyvault_numpages_${book.slug}`, String(numPages));
      }
    }

    // Auto save progress to db if authorized and not sample mode
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

    const handleResize = () => renderActivePage();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [currentPage, zoomLevel, themeMode, renderActivePage, isSampleMode, numPages, book.id]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentPage((prev) => Math.min(numPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === '+' || (e.ctrlKey && e.key === '=')) {
        e.preventDefault();
        setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
      } else if (e.key === '-' || (e.ctrlKey && e.key === '-')) {
        e.preventDefault();
        setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

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
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();

  return (
    <div
      ref={readerContainerRef}
      onContextMenu={handleContextMenu}
      onCopy={handleCopy}
      onCut={handleCopy}
      className={`min-h-screen flex flex-col font-sans select-none relative overflow-hidden transition-colors duration-300 ${
        themeMode === 'dark'
          ? 'bg-[#06080E] text-slate-100'
          : themeMode === 'sepia'
          ? 'bg-[#EAE0CA] text-stone-900'
          : 'bg-[#0B0F19] text-slate-100'
      }`}
    >
      {/* Free Sample Preview Top Banner */}
      {isSampleMode && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1.5 text-[11px] sm:text-xs font-sans font-bold flex items-center justify-between shadow-md z-50 shrink-0">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>FREE SAMPLE PREVIEW • WATERMARK & ANTI-SCREENSHOT PROTECTED</span>
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
      <header className="sticky top-0 z-40 bg-[#080C14]/95 backdrop-blur-xl border-b border-[#1E293E] px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0 gap-2">
        
        {/* Left: Exit Reader Button */}
        <Link
          href={`/books/${book.slug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141C2E] border border-[#26354D] hover:border-rose-500 text-rose-300 text-xs font-bold transition-all shrink-0 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">EXIT READER</span>
          <span className="sm:hidden text-[11px]">EXIT</span>
        </Link>

        {/* Center: Book Title & Quick Page Flipping */}
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="font-serif text-xs sm:text-sm font-bold text-rose-100 line-clamp-1 max-w-[120px] sm:max-w-xs hidden md:block">
            {book.title}
          </h1>

          {!loading && numPages > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 bg-[#0E1422] border border-[#222E44] px-2 sm:px-3 py-1 rounded-xl text-xs font-semibold text-slate-300">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:text-rose-300 disabled:opacity-30 transition-colors"
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
                className="p-1 hover:text-rose-300 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Reading Theme & Tools Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
            {/* Bookmark Ribbon Button */}
            <button
              onClick={handleToggleBookmark}
              className={`px-2 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 shadow-sm shrink-0 ${
                bookmarkedPage === currentPage
                  ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                  : 'bg-[#0E1422] border-[#232E44] text-rose-300 hover:border-rose-500/70 hover:bg-rose-500/10'
              }`}
              title={bookmarkedPage === currentPage ? 'Ribbon Bookmark is on this page! Click to remove' : 'Place Ribbon Bookmark on this page'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedPage === currentPage ? 'fill-white text-white' : 'text-rose-400'}`} />
              <span className="hidden md:inline">
                {bookmarkedPage === currentPage ? `BOOKMARKED (P. ${currentPage})` : 'BOOKMARK PAGE'}
              </span>
              <span className="md:hidden text-[11px]">
                {bookmarkedPage === currentPage ? `P.${currentPage}` : 'SAVE'}
              </span>
            </button>

          {/* Quick Jump to Bookmark Button if user is on a different page */}
          {bookmarkedPage !== null && bookmarkedPage !== currentPage && (
            <button
              onClick={() => setCurrentPage(bookmarkedPage)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all"
              title={`Jump directly to your bookmark on page ${bookmarkedPage}`}
            >
              <span>📌 Go to P.{bookmarkedPage}</span>
            </button>
          )}

          {/* Theme Modes Selector */}
          <div className="hidden sm:flex items-center bg-[#0E1422] border border-[#1E293E] p-1 rounded-xl gap-1">
            <button
              onClick={() => setThemeMode('white')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                themeMode === 'white' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Crisp White Paper Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeMode('sepia')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                themeMode === 'sepia' ? 'bg-[#D9CEB2] text-amber-950 font-bold shadow' : 'text-slate-400 hover:text-amber-300'
              }`}
              title="Warm Sepia Parchment Mode"
            >
              <BookMarked className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                themeMode === 'dark' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-rose-300'
              }`}
              title="Midnight Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#0E1422] border border-[#1E293E] px-1 py-1 rounded-xl gap-1 text-slate-400">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1 hover:text-rose-300 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded hover:bg-[#1E293E] hover:text-rose-200 transition-colors"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
              className="p-1 hover:text-rose-300 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#0E1422] border border-[#1E293E] text-slate-300 hover:text-rose-300 transition-all hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Security Badge */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Protected DRM</span>
          </div>

        </div>

      </header>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0E1422]/95 border-2 border-rose-500/80 px-5 py-2.5 rounded-2xl shadow-2xl shadow-rose-500/30 text-rose-100 text-xs font-bold flex items-center gap-2 backdrop-blur-xl">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CANVAS PAGE DISPLAY */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto px-1 sm:px-4 md:px-6 py-2 sm:py-6 flex flex-col items-center relative">

        {/* ACTIVE PAGE HTML5 CANVAS */}

        <div
          ref={containerRef}
          style={{
            width: `${Math.round(pageDimensions.width * zoomLevel)}px`,
            maxWidth: zoomLevel <= 1.0 ? '100%' : 'none',
          }}
          className="my-1 sm:my-2 flex flex-col items-center transition-all duration-150 relative shrink-0 max-w-full"
        >
          {/* Skeleton placeholder reserves space before PDF loads to eliminate CLS */}
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
          {/* PAPER CANVAS CONTAINER WITH APPLIED THEME FILTER */}
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
              title={bookmarkedPage === currentPage ? 'Remove Ribbon Bookmark' : 'Place Ribbon Bookmark on this page'}
            >
              <div
                className={`w-7 sm:w-8 h-12 sm:h-14 shadow-2xl transition-all duration-300 relative flex items-center justify-center ${
                  bookmarkedPage === currentPage
                    ? 'bg-gradient-to-b from-rose-600 via-rose-500 to-rose-700 shadow-rose-500/50 translate-y-0'
                    : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 opacity-40 hover:opacity-100 hover:from-rose-600 hover:to-rose-700 -translate-y-3 group-hover:translate-y-0'
                }`}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)',
                }}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    bookmarkedPage === currentPage ? 'text-amber-200 fill-amber-200' : 'text-slate-300 fill-transparent'
                  }`}
                />
              </div>
            </div>
            {/* 🛡️ PAPER CANVAS WRAPPER — hidden at DOM level during rendering (no React batching gap) */}
            <div
              ref={canvasWrapperRef}
              className={`relative w-full transition-all duration-200 ${
                isWindowBlurred ? 'blur-2xl opacity-20 pointer-events-none filter' : 'opacity-100'
              }`}
              style={{ transition: 'opacity 0.15s ease, filter 0.2s ease' }}
            >
              {/* HTML5 CANVAS (RENDERED AT HIGH DPI WITH WATERMARK STAMP) */}
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                } as React.CSSProperties}
                className="pointer-events-none select-none"
              />

              {/* 🛡️ INVISIBLE TOUCH INTERCEPTOR — blocks iOS long-press Save Image */}
              <div
                aria-hidden="true"
                className="absolute inset-0 z-20"
                style={{
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  touchAction: 'pan-y',
                } as React.CSSProperties}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {/* 🛡️ ACTIVE SCREEN CAPTURE & FOCUS LOSS PRIVACY SHIELD */}
            {isWindowBlurred && (
              <div
                onClick={() => setIsWindowBlurred(false)}
                className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer animate-fade-in"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-3 shadow-lg shadow-rose-500/20">
                  <ShieldCheck className="w-7 h-7 text-rose-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-rose-100 font-sans tracking-wide">
                  SCREEN CAPTURE PROTECTED
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                  Reading suspended while the browser window is inactive or screenshot tools are opened.
                </p>
                <span className="mt-4 px-4 py-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-md hover:bg-rose-600 transition-all">
                  Click to Resume Reading
                </span>
              </div>
            )}
          </div>

          {/* BOTTOM PAGE TURN NAVIGATION CONTROLS */}
          {!loading && !error && (
          <div className="w-full flex items-center justify-between pt-4 pb-2 font-sans text-xs text-slate-400 px-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0E1422] border border-[#222E44] hover:border-rose-500 text-rose-300 text-xs disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Page {currentPage} of {numPages} ({Math.round((currentPage / (numPages || 1)) * 100)}%)
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(numPages, prev + 1))}
              disabled={currentPage >= numPages}
              aria-label="Next page"
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs disabled:opacity-30 shadow-md transition-all"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          )}
        </div>

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
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/30 hover:brightness-110 transition-all inline-flex items-center gap-2"
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
