'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);

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
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isDevToolsLocked, setIsDevToolsLocked] = useState(false);

  // Reader Controls State
  const [themeMode, setThemeMode] = useState<'white' | 'sepia' | 'dark'>('white');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [pageDimensions, setPageDimensions] = useState({ width: 680, height: 1051 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState(() => String(currentPage || 1));
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);

  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Touch Swipe & Pinch Zoom Refs
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchDistanceRef = useRef<number | null>(null);

  const pdfStreamUrl = `/api/reader/stream-pdf/${book.slug}${isSampleMode ? '?sample=true' : ''}`;

  // 🛡️ COMPREHENSIVE ZERO-LATENCY ANTI-SCREENSHOT & ANTI-DEVTOOLS SHIELD
  useEffect(() => {
    const wipeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#05070d';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.font = '14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ STORYVAULT DRM: SCREEN CAPTURE & DEVTOOLS PROHIBITED', canvas.width / 2, canvas.height / 2);
        }
      }
    };

    // 0. Neutralize Canvas Exfiltration APIs (Prevents Console toDataURL/toBlob/getImageData)
    try {
      HTMLCanvasElement.prototype.toDataURL = function () {
        wipeCanvas();
        setIsDevToolsLocked(true);
        setIsWindowBlurred(true);
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      };
      HTMLCanvasElement.prototype.toBlob = function (callback: any) {
        wipeCanvas();
        setIsDevToolsLocked(true);
        setIsWindowBlurred(true);
        if (callback) callback(new Blob([], { type: 'image/png' }));
      };
      CanvasRenderingContext2D.prototype.getImageData = function () {
        wipeCanvas();
        setIsDevToolsLocked(true);
        setIsWindowBlurred(true);
        throw new Error('Canvas extraction prohibited by StoryVault DRM.');
      };
    } catch (err) {}

    // Multi-vector DevTools Detection
    const checkDevTools = (): boolean => {
      if (typeof window === 'undefined') return false;

      // Vector A: Docked Window Dimension Delta (>160px difference)
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        return true;
      }

      // Vector B: Debugger timing threshold (Undocked DevTools & Breakpoint inspection)
      const start = performance.now();
      try {
        const d = new Function('debugger');
        d();
      } catch (e) {}
      if (performance.now() - start > 60) {
        return true;
      }

      return false;
    };

    // 1. Override window.print() & beforeprint
    window.print = () => {
      wipeCanvas();
      setIsWindowBlurred(true);
      return false;
    };

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      wipeCanvas();
      setIsWindowBlurred(true);
    };

    // Purge Clipboard & Lock Screen on Screenshot Action or DevTools
    const purgeClipboardAndLock = (isDevToolsTrigger = false) => {
      wipeCanvas();
      if (isDevToolsTrigger) {
        setIsDevToolsLocked(true);
      }
      setIsWindowBlurred(true);
      try {
        const ta = document.createElement('textarea');
        ta.value = '⚠️ STORYVAULT DRM: SCREEN CAPTURE & INSPECTION PROHIBITED';
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) {}

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('⚠️ STORYVAULT DRM: SCREEN CAPTURE & INSPECTION PROHIBITED').catch(() => {});
      }
    };

    // Continuous DevTools & Delayed-Screenshot Sentinel (runs every 350ms)
    const devToolsInterval = setInterval(() => {
      if (checkDevTools()) {
        purgeClipboardAndLock(true);
      }
    }, 350);

    // Console Getter Trap (Catches console commands like :screenshot --delay or custom scripts)
    const consoleTrap = document.createElement('div');
    Object.defineProperty(consoleTrap, 'id', {
      get: () => {
        purgeClipboardAndLock(true);
        return 'STORYVAULT_SECURITY_ACTIVE';
      },
    });

    const consoleTrapInterval = setInterval(() => {
      try {
        console.log(consoleTrap);
        console.clear();
      } catch (e) {}
    }, 1000);

    // 2. Hardware, Screenshot & DevTools Intercept
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
      const isWindowsOrMetaKey = e.key === 'Meta' || e.key === 'Win' || e.code?.startsWith('Meta');
      const isSnippingTool = (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === '4' || e.key === '3');
      const isDevTools =
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.key === 'P' || e.key === 'p' || e.key === 'K' || e.key === 'k')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'));
      const isPrintOrSave = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S');

      // Block Developer Tools Shortcuts & Save/Print
      if (isDevTools || isPrintOrSave) {
        e.preventDefault();
        e.stopPropagation();
        purgeClipboardAndLock(true);
        return;
      }

      // If user touches ANY screenshot key or modifier (Win key for Win+Shift+S, PrintScreen), instant blackout!
      if (isPrintScreen || isWindowsOrMetaKey || isSnippingTool) {
        e.preventDefault();
        e.stopPropagation();
        purgeClipboardAndLock();
      }
    };

    // Handle keyup specifically for Windows OS PrintScreen & Meta release
    const handleKeyUp = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
      const isWindowsOrMetaKey = e.key === 'Meta' || e.key === 'Win' || e.code?.startsWith('Meta');
      if (isPrintScreen || isWindowsOrMetaKey) {
        purgeClipboardAndLock();
      }
    };

    // 3. Tab switch & window minimization detection (true backgrounding)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        purgeClipboardAndLock();
      }
    };

    // 4. Mobile Multi-Touch Screenshot Gesture Detection & Pinch Zoom
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        purgeClipboardAndLock();
      }
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

    // 5. Ctrl + Wheel Zoom
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setZoomLevel((z) => Math.min(3.0, Math.max(0.5, Number((z + delta).toFixed(2)))));
      }
    };

    // 6. Zero-Latency Blur & Screenshot Tool Defense
    // When Snipping Tool, Win+Shift+S, or screen capture opens, the OS window instantly loses focus (blur).
    // We immediately wipe the canvas to black, lock the screen, and purge the clipboard.
    const handleWindowBlur = () => {
      purgeClipboardAndLock();
    };

    // 7. Block Screen Recording via MediaDevices API
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      try {
        const nav = navigator.mediaDevices as any;
        if (nav.getDisplayMedia) {
          nav.getDisplayMedia = async () => {
            purgeClipboardAndLock();
            throw new Error('Screen capture prohibited by StoryVault DRM');
          };
        }
      } catch (e) {}
    }

    // 8. Block Context Menu, Dragging & Selection
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
        e.clipboardData.setData('text/plain', '⚠️ PROTECTED MANUSCRIPT - DO NOT COPY');
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheelZoom, { passive: false });
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('copy', handleCopy);

    return () => {
      clearInterval(devToolsInterval);
      clearInterval(consoleTrapInterval);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
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
        const total = isSampleMode ? Math.min(10, pdf.numPages) : pdf.numPages;
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
  const renderActivePage = useCallback(async () => {
    if (!pdfDocRef.current || currentPage < 1) return;

    setRenderingPage(true);
    try {
      const page = await pdfDocRef.current.getPage(currentPage);

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
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

      let baseWidth = 640;
      if (screenWidth < 640) {
        baseWidth = screenWidth - 24;
      } else if (screenWidth < 1024) {
        baseWidth = Math.min(680, screenWidth - 48);
      } else {
        baseWidth = Math.min(720, Math.round(screenWidth * 0.52));
      }

      const baseScale = baseWidth / unscaledViewport.width;
      const baseHeight = unscaledViewport.height * baseScale;
      setPageDimensions({ width: baseWidth, height: baseHeight });

      // Super crisp high-DPI canvas buffer (2x or devicePixelRatio)
      const dpr = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 1) : 2;
      const finalScale = baseScale * zoomLevel * dpr;
      const viewport = page.getViewport({ scale: finalScale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;

      // 🛡️ FORENSIC WATERMARK MATRIX: Diagonal Unobtrusive Pattern + Margin Headers
      // Preserves comfortable reading while making ANY screenshot / capture indelibly watermarked
      const stampText = watermark || 'STORYVAULT • LICENSED DIGITAL MANUSCRIPT';

      // Layer 1: Subtle Repeating Diagonal Watermark Grid across the entire page body
      context.save();
      context.font = '11px monospace';
      context.textAlign = 'center';
      context.fillStyle = themeMode === 'dark'
        ? 'rgba(255, 255, 255, 0.07)'
        : themeMode === 'sepia'
        ? 'rgba(120, 53, 15, 0.08)'
        : 'rgba(0, 0, 0, 0.06)';

      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(-0.38); // -22 degrees
      const maxDim = Math.max(canvas.width, canvas.height);
      const stepX = 300;
      const stepY = 170;
      for (let x = -maxDim * 1.2; x < maxDim * 1.2; x += stepX) {
        for (let y = -maxDim * 1.2; y < maxDim * 1.2; y += stepY) {
          context.fillText(stampText, x, y);
        }
      }
      context.restore();

      // Layer 2: Clean top & bottom margin forensic headers
      context.save();
      context.font = '10px monospace';
      context.textAlign = 'center';
      context.fillStyle = themeMode === 'dark' 
        ? 'rgba(255, 255, 255, 0.22)' 
        : themeMode === 'sepia'
        ? 'rgba(120, 53, 15, 0.25)'
        : 'rgba(0, 0, 0, 0.18)';

      // Clean top header margin line (above main story content)
      context.fillText(`STORYVAULT DIGITAL EDITION • ${stampText}`, canvas.width / 2, 22);
      // Clean bottom footer margin line (below main story content)
      context.fillText(`PROTECTED MANUSCRIPT • ${stampText} • ALL RIGHTS RESERVED`, canvas.width / 2, canvas.height - 14);
      context.restore();

    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Failed to render active PDF page:', err);
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
      {/* Load Local PDF.js Engine */}
      <Script
        src="/pdf.min.js"
        onLoad={() => setIsPdfJsLoaded(true)}
      />

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
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              bookmarkedPage === currentPage
                ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30'
                : 'bg-[#0E1422] border-[#232E44] text-rose-300 hover:border-rose-500/70 hover:bg-rose-500/10'
            }`}
            title={bookmarkedPage === currentPage ? 'Ribbon Bookmark is on this page! Click to remove' : 'Place Ribbon Bookmark on this page'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedPage === currentPage ? 'fill-white text-white' : 'text-rose-400'}`} />
            <span className="hidden sm:inline">
              {bookmarkedPage === currentPage ? `BOOKMARKED (P. ${currentPage})` : 'BOOKMARK PAGE'}
            </span>
            <span className="sm:hidden text-[11px]">
              {bookmarkedPage === currentPage ? `P.${currentPage}` : 'BOOKMARK'}
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
      <main className="flex-1 w-full overflow-auto p-2 sm:p-6 flex flex-col items-center relative">

        {/* ACTIVE PAGE HTML5 CANVAS */}

        <div
          ref={containerRef}
          style={{
            width: `${Math.round(pageDimensions.width * zoomLevel)}px`,
            maxWidth: 'none',
          }}
          className="my-2 flex flex-col items-center transition-all duration-150 relative shrink-0"
        >
          {/* Skeleton placeholder reserves space before PDF loads to eliminate CLS */}
          {(loading || error) && !isWindowBlurred && (
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
          {/* 🛡️ ULTRA-STRICT ZERO-LATENCY SCREEN CAPTURE & RECORDING SHIELD */}
          {isWindowBlurred && (
            <div className="fixed inset-0 bg-[#05070D] z-[99999] flex flex-col items-center justify-center p-6 text-center select-none cursor-default">
              <div className="max-w-md w-full bg-[#0E1422] border-2 border-rose-500/60 rounded-3xl p-8 space-y-4 shadow-2xl shadow-rose-500/20">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-rose-100 tracking-tight">
                  {isDevToolsLocked ? 'DEVELOPER TOOLS DETECTED' : 'SCREEN CAPTURE RESTRICTED'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isDevToolsLocked
                    ? 'Developer tools, delayed console commands, and inspector utilities are strictly prohibited. Please close Developer Tools completely to resume reading.'
                    : 'Screenshots, screen recording tools (Snipping Tool, PrintScreen), and window switching are prohibited to protect the author\'s copyright.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      // Validate that DevTools is not open before unlocking
                      const threshold = 160;
                      const widthDiff = window.outerWidth - window.innerWidth > threshold;
                      const heightDiff = window.outerHeight - window.innerHeight > threshold;
                      if (widthDiff || heightDiff) {
                        setToastMessage('⚠️ Developer Tools are still open. Please close them completely.');
                        setTimeout(() => setToastMessage(null), 3000);
                        return;
                      }

                      setIsDevToolsLocked(false);
                      setIsWindowBlurred(false);
                      setTimeout(() => {
                        renderActivePage();
                      }, 50);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/30 transition-all uppercase tracking-wider"
                  >
                    RETURN TO READING
                  </button>
                </div>
              </div>
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
              display: isWindowBlurred ? 'none' : undefined,
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
            {renderingPage && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-30">
                <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
              </div>
            )}

            {/* HTML5 CANVAS (RENDERED AT HIGH DPI WITH WATERMARK STAMP) */}
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
