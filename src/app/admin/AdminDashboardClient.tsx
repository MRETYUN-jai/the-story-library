'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  BookOpen,
  DollarSign,
  Users,
  Plus,
  Edit,
  FileText,
  History,
  TrendingUp,
  CheckCircle,
  Tag,
  Copy,
  Check,
  Trash2,
  X,
  Upload,
  CreditCard,
  QrCode,
  RefreshCw,
  Lock,
  Eye,
  AlertCircle,
  ShieldCheck,
  Search,
  Mail,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number;
    totalBooks: number;
    totalPurchases: number;
    totalRevenue: number;
    activeReaders: number;
  };
  recentPurchases: any[];
  pendingPurchases?: any[];
  books: any[];
  seriesList: any[];
  readersList?: any[];
}

export default function AdminDashboardClient({
  stats,
  recentPurchases,
  pendingPurchases = [],
  books: initialBooks,
  seriesList,
  readersList = [],
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'books' | 'manuscripts' | 'coupons' | 'approvals' | 'orders' | 'settings' | 'readers'>('analytics');
  const [booksList, setBooksList] = useState(initialBooks);
  const [readersListState, setReadersListState] = useState(readersList);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string; role?: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [pendingList, setPendingList] = useState<any[]>(pendingPurchases);
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<string | null>(null);
  const [approvingPurchaseId, setApprovingPurchaseId] = useState<string | null>(null);
  const [showReadersModal, setShowReadersModal] = useState(false);
  const [readerSearchQuery, setReaderSearchQuery] = useState('');

  // Book Form State
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    slug: '',
    description: '',
    genre: 'Romantic Drama',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    digitalPrice: 199,
    paperbackEnabled: true,
    paperbackLink: '',
    paperbackPublisher: 'Pothi Publishing (pothi.com)',
    hardcoverEnabled: true,
    hardcoverLink: '',
    hardcoverPublisher: 'Pothi Publishing (pothi.com)',
    kindleEnabled: true,
    kindleLink: '',
    kindlePublisher: 'Amazon Kindle',
  });

  // Chapter / Manuscript Form State
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<any>(booksList[0] || null);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [showChapterTextForm, setShowChapterTextForm] = useState(false);
  const [chapterFormData, setChapterFormData] = useState({
    chapterNumber: 1,
    title: '',
    content: '',
  });

  // Keep selectedBookForChapters in sync if booksList changes
  useEffect(() => {
    if (!selectedBookForChapters && booksList.length > 0) {
      setSelectedBookForChapters(booksList[0]);
    } else if (selectedBookForChapters) {
      const updated = booksList.find((b) => b.id === selectedBookForChapters.id);
      if (updated && updated.pdfUrl !== selectedBookForChapters.pdfUrl) {
        setSelectedBookForChapters(updated);
      }
    }
  }, [booksList, selectedBookForChapters]);

  // Coupon State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [couponFormData, setCouponFormData] = useState({
    code: 'LOVE50',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    maxUses: 100,
    bookId: '',
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // UPI Settings State
  const [upiSettings, setUpiSettings] = useState({
    authorUpiId: 'mretyunjai006@oksbi',
    authorName: 'Mretyun Jai B',
  });
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiMsg, setUpiMsg] = useState('');
  const [upiError, setUpiError] = useState('');

  // Fetch Coupons and UPI Settings when tab opens
  useEffect(() => {
    if (activeTab === 'coupons') {
      fetch('/api/admin/coupons')
        .then((res) => res.json())
        .then((data) => {
          if (data.coupons) setCoupons(data.coupons);
        })
        .catch((err) => console.error(err));
    }
    if (activeTab === 'settings') {
      fetch('/api/admin/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.authorUpiId) {
            setUpiSettings({
              authorUpiId: data.authorUpiId,
              authorName: data.authorName || 'Mretyun Jai B',
            });
          }
        })
        .catch((err) => console.error(err));
    }
  }, [activeTab]);

  const handleSaveUpiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpi(true);
    setUpiMsg('');
    setUpiError('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upiSettings),
      });

      const data = await res.json();
      if (!res.ok) {
        setUpiError(data.error || 'Failed to save UPI settings');
      } else {
        setUpiMsg(data.message || 'UPI settings updated successfully!');
        setTimeout(() => setUpiMsg(''), 4000);
      }
    } catch (err: any) {
      setUpiError(err.message || 'Network error updating UPI settings');
    } finally {
      setSavingUpi(false);
    }
  };

  // Approve or Reject Pending Purchase Proof
  const handleProcessPurchase = async (purchaseId: string, action: 'approve' | 'reject') => {
    setApprovingPurchaseId(purchaseId);
    try {
      const res = await fetch('/api/admin/approve-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error || 'Failed to process purchase'}`);
      } else {
        setPendingList((prev) => prev.filter((p) => p.id !== purchaseId));
        setMsg(action === 'approve' ? 'Payment approved & book unlocked for reader! Notification email dispatched.' : 'Payment proof rejected.');
        setTimeout(() => setMsg(''), 5000);
      }
    } catch (err: any) {
      setMsg(err.message || 'Network error processing purchase');
    } finally {
      setApprovingPurchaseId(null);
    }
  };

  // Save Book (Create or Edit)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const endpoint = '/api/admin/books';
      const method = editingBook ? 'PUT' : 'POST';
      const payload = editingBook ? { id: editingBook.id, ...bookFormData } : bookFormData;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error || 'Failed to save book'}`);
      } else {
        setMsg(editingBook ? 'Book details updated successfully!' : 'New book added successfully!');
        setShowAddBookModal(false);
        setEditingBook(null);
        window.location.reload();
      }
    } catch (err) {
      setMsg('Network error saving book.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Book
  const handleDeleteBook = (bookId: string, bookTitle: string) => {
    setBookToDelete({ id: bookId, title: bookTitle });
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    setDeleting(true);
    setMsg('');

    try {
      const res = await fetch(`/api/admin/books?id=${bookToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setBooksList((prev) => prev.filter((b) => b.id !== bookToDelete.id));
        setMsg(`"${bookToDelete.title}" has been deleted.`);
        setBookToDelete(null);
      } else {
        setMsg(`Failed to delete book: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setMsg(`Network error: ${err.message || 'Failed to delete'}`);
    } finally {
      setDeleting(false);
    }
  };

  // Upload Manuscript (.pdf) from Device
  const handleUploadManuscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForChapters) {
      setUploadMsg({ type: 'error', text: 'Please select a book first.' });
      return;
    }
    if (!manuscriptFile) {
      setUploadMsg({ type: 'error', text: 'Please choose a PDF manuscript file (.pdf) from your device.' });
      return;
    }

    setUploadingPdf(true);
    setUploadMsg(null);

    const chunkSize = 2 * 1024 * 1024; // 2 MB chunks (avoids Vercel 4.5MB payload limit)
    const totalChunks = Math.ceil(manuscriptFile.size / chunkSize);
    const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      let finalData: any = null;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(manuscriptFile.size, start + chunkSize);
        const chunkBlob = manuscriptFile.slice(start, end);

        if (totalChunks > 1) {
          setUploadMsg({
            type: 'success',
            text: `Uploading ${manuscriptFile.name} (Part ${chunkIndex + 1} of ${totalChunks} — ${Math.round(((chunkIndex + 1) / totalChunks) * 100)}%)...`,
          });
        }

        const formData = new FormData();
        formData.append('file', chunkBlob, manuscriptFile.name);
        formData.append('fileName', manuscriptFile.name);
        formData.append('bookId', selectedBookForChapters.id);
        formData.append('chunkIndex', String(chunkIndex));
        formData.append('totalChunks', String(totalChunks));
        formData.append('uploadId', uploadId);

        const res = await fetch('/api/admin/upload-manuscript', {
          method: 'POST',
          body: formData,
        });

        const textResp = await res.text();
        let data: any;
        try {
          data = JSON.parse(textResp);
        } catch {
          throw new Error(textResp.slice(0, 120) || `Server error (${res.status})`);
        }

        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload manuscript chunk');
        }

        finalData = data;
      }

      if (finalData) {
        const updatedPdfUrl = finalData.pdfUrl || `${selectedBookForChapters.slug}.pdf`;
        setUploadMsg({
          type: 'success',
          text: finalData.message || 'Manuscript successfully uploaded and secured in DRM Vault!',
          details: {
            fileName: finalData.fileName || manuscriptFile.name,
            fileSizeMb: finalData.fileSizeMb || (manuscriptFile.size / (1024 * 1024)).toFixed(2),
            pageCount: finalData.pageCount || 0,
            pdfUrl: updatedPdfUrl,
          },
        });

        setSelectedBookForChapters((prev: any) => (prev ? { ...prev, pdfUrl: updatedPdfUrl } : null));
        setBooksList((prev: any[]) =>
          prev.map((b) => (b.id === selectedBookForChapters.id ? { ...b, pdfUrl: updatedPdfUrl } : b))
        );
        setManuscriptFile(null);
      }
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message || 'Network error while uploading manuscript PDF' });
    } finally {
      setUploadingPdf(false);
    }
  };

  // Save Chapter
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForChapters) return;
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookForChapters.id,
          ...chapterFormData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error || 'Failed to add chapter'}`);
      } else {
        setMsg(`Chapter ${chapterFormData.chapterNumber} added to ${selectedBookForChapters.title}!`);
        setChapterFormData({
          chapterNumber: chapterFormData.chapterNumber + 1,
          title: '',
          content: '',
        });
        window.location.reload();
      }
    } catch (err) {
      setMsg('Network error saving chapter.');
    } finally {
      setSaving(false);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${data.error || 'Failed to create coupon'}`);
      } else {
        setMsg(`Coupon "${data.coupon.code}" created successfully!`);
        setCoupons((prev) => [data.coupon, ...prev]);
        setCouponFormData({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxUses: 100,
          bookId: '',
        });
      }
    } catch (err) {
      setMsg('Network error creating coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBookClick = (book: any) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      slug: book.slug,
      description: book.description || '',
      genre: book.genre || 'Romantic Drama',
      coverImage: book.coverImage || '',
      digitalPrice: book.digitalPrice || 199,
      paperbackEnabled: book.paperbackEnabled ?? true,
      paperbackLink: book.paperbackLink || '',
      paperbackPublisher: book.paperbackPublisher || 'Pothi Publishing (pothi.com)',
      hardcoverEnabled: book.hardcoverEnabled ?? true,
      hardcoverLink: book.hardcoverLink || '',
      hardcoverPublisher: book.hardcoverPublisher || 'Pothi Publishing (pothi.com)',
      kindleEnabled: book.kindleEnabled ?? true,
      kindleLink: book.kindleLink || '',
      kindlePublisher: book.kindlePublisher || 'Amazon Kindle',
    });
    setShowAddBookModal(true);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState(false);

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setDeletingCoupon(true);
    setMsg('');

    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponToDelete.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
        setMsg(`Coupon "${couponToDelete.code}" has been removed permanently.`);
        setCouponToDelete(null);
        setTimeout(() => setMsg(''), 4000);
      } else {
        setMsg(`Failed to delete coupon: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setMsg(`Network error: ${err.message || 'Failed to remove coupon'}`);
    } finally {
      setDeletingCoupon(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    setMsg('');

    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setReadersListState((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setMsg(`User "${userToDelete.name || userToDelete.email}" has been deleted permanently.`);
        setUserToDelete(null);
        setTimeout(() => setMsg(''), 4000);
      } else {
        setMsg(`Failed to delete user: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setMsg(`Network error: ${err.message || 'Failed to delete user'}`);
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredReaders = readersListState.filter((reader: any) => {
    const q = readerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (reader.name && reader.name.toLowerCase().includes(q)) ||
      (reader.email && reader.email.toLowerCase().includes(q)) ||
      (reader.nickname && reader.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-transparent text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER PANEL */}
        <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-500/10 backdrop-blur-sm px-3 py-1 rounded-full border border-rose-500/20">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              AUTHOR & ADMIN PANEL
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-rose-100 uppercase tracking-wide">
              STORYVAULT MANAGEMENT
            </h1>
            <p className="text-xs text-slate-400">
              Manage published books, chapter manuscripts, coupon codes, and sales analytics
            </p>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 bg-[#080C14]/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.08] relative z-10">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ANALYTICS</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'books'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MANAGE BOOKS ({booksList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('manuscripts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manuscripts'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MANUSCRIPTS</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'coupons'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>COUPONS</span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>PAYMENT APPROVALS</span>
              {pendingList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 animate-pulse">
                  {pendingList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>PURCHASES ({recentPurchases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>UPI & PAYMENT SETTINGS</span>
            </button>

            <button
              onClick={() => setActiveTab('readers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'readers'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>READERS & ACCOUNTS ({readersListState.length})</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs font-bold text-rose-300 text-center">
            {msg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">TOTAL REVENUE</span>
                <p className="font-serif text-3xl font-bold text-rose-300">₹{stats.totalRevenue}</p>
                <p className="text-[11px] text-slate-400">Verified Digital Access Sales</p>
              </div>

              <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">TOTAL DIGITAL PURCHASES</span>
                <p className="font-serif text-3xl font-bold text-rose-100">{stats.totalPurchases}</p>
                <p className="text-[11px] text-slate-400">Books Unlocked</p>
              </div>

              <button
                type="button"
                onClick={() => setShowReadersModal(true)}
                className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] hover:border-rose-500/60 hover:bg-[#141B2D]/70 rounded-2xl p-6 shadow-xl space-y-2 text-left transition-all group cursor-pointer"
                title="Click to view all registered readers"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-300 uppercase tracking-wider block font-bold transition-colors">
                    TOTAL READERS
                  </span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-rose-500/25 transition-all">
                    <Users className="w-3 h-3" />
                    <span>VIEW ACCOUNTS</span>
                  </span>
                </div>
                <p className="font-serif text-3xl font-bold text-rose-100 group-hover:text-rose-200 transition-colors">
                  {stats.totalUsers}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Registered Accounts</span>
                  <span className="text-rose-400 text-[10px] font-semibold group-hover:underline">
                    Click to view &rarr;
                  </span>
                </p>
              </button>

              <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">PUBLISHED BOOKS</span>
                <p className="font-serif text-3xl font-bold text-rose-100">{stats.totalBooks}</p>
                <p className="text-[11px] text-slate-400">Live Titles in Catalog</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MANAGE BOOKS (WITH EDIT DETAILS & RED DELETE BUTTON) */}
        {/* ========================================================================= */}
        {activeTab === 'books' && (
          <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-rose-100">ALL PUBLISHED BOOKS</h2>
              <button
                onClick={() => {
                  setEditingBook(null);
                  setBookFormData({
                    title: '',
                    slug: '',
                    description: '',
                    genre: 'Romantic Drama',
                    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
                    digitalPrice: 199,
                    paperbackEnabled: true,
                    paperbackLink: '',
                    paperbackPublisher: 'Pothi Publishing (pothi.com)',
                    hardcoverEnabled: true,
                    hardcoverLink: '',
                    hardcoverPublisher: 'Pothi Publishing (pothi.com)',
                    kindleEnabled: true,
                    kindleLink: '',
                    kindlePublisher: 'Amazon Kindle',
                  });
                  setShowAddBookModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ADD NEW BOOK</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {booksList.map((book) => (
                <div
                  key={book.id}
                  className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-20 aspect-[2/3] object-cover rounded-xl border border-[#283652] shadow-md shrink-0 bg-[#05080E]"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                        {book.genre || 'ROMANTIC DRAMA'}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-rose-100">{book.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">{book.description || 'No description added yet.'}</p>
                      <div className="flex items-center gap-4 text-xs text-rose-300 font-semibold pt-1">
                        <span>Digital Price: ₹{book.digitalPrice}</span>
                        <span>Chapters: {book.chapters?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleEditBookClick(book)}
                      className="py-2.5 px-4 rounded-xl bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      <span>EDIT DETAILS & LINKS</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      className="py-2.5 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>DELETE BOOK</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MANUSCRIPTS & CHAPTER MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'manuscripts' && (
          <div className="space-y-8 font-sans">
            {/* Book Selector & Active Status Bar */}
            <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                    ACTIVE BOOK SELECTION
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-100">
                    Manuscript & Secure DRM Vault
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select the story to upload complete manuscript PDFs from your device and manage reading DRM
                  </p>
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={selectedBookForChapters?.id || (booksList[0]?.id ?? '')}
                    onChange={(e) => {
                      const found = booksList.find((b) => b.id === e.target.value);
                      setSelectedBookForChapters(found || null);
                      setUploadMsg(null);
                      setManuscriptFile(null);
                    }}
                    className="w-full sm:min-w-[280px] bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3.5 text-slate-200 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                  >
                    {booksList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {b.pdfUrl ? '✓ (DRM Ready)' : '(No PDF)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBookForChapters && (
                <div className="pt-4 border-t border-[#1A2336] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedBookForChapters.coverImage && (
                      <img
                        src={selectedBookForChapters.coverImage}
                        alt={selectedBookForChapters.title}
                        className="w-12 h-16 object-cover rounded-lg border border-[#283652] shadow-md"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-rose-100">
                          {selectedBookForChapters.title}
                        </h4>
                        {selectedBookForChapters.pdfUrl ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            DRM MANUSCRIPT ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertCircle className="w-3 h-3" />
                            NO PDF UPLOADED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Genre: <span className="text-slate-200">{selectedBookForChapters.genre || 'Romantic Drama'}</span> • Digital Access: <span className="text-rose-300 font-semibold">₹{selectedBookForChapters.digitalPrice || 199}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/read/${selectedBookForChapters.slug}`}
                      target="_blank"
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/30 hover:to-purple-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/10 transition-all"
                    >
                      <Eye className="w-4 h-4 text-rose-400" />
                      <span>OPEN CANVAS READER PREVIEW</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {selectedBookForChapters && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. UPLOAD MANUSCRIPT FROM DEVICE (PRIMARY) */}
                <div className="lg:col-span-7 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        DIRECT DEVICE UPLOAD
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-rose-100">
                      Upload Manuscript (.pdf) from Your Device
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Upload the complete manuscript file directly from your computer. It is stored securely in the database DRM vault (<code className="text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded">private_manuscripts/</code>) and streamed strictly via in-memory HTML5 Canvas.
                    </p>
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleUploadManuscript} className="space-y-6">
                    {/* Drag & Drop File Zone */}
                    <div className="relative">
                      <input
                        type="file"
                        id="manuscript-file-input"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setManuscriptFile(file);
                            setUploadMsg(null);
                          }
                        }}
                        className="sr-only"
                      />

                      {!manuscriptFile ? (
                        <label
                          htmlFor="manuscript-file-input"
                          className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl border-2 border-dashed border-[#283652] hover:border-rose-500/60 bg-gradient-to-b from-[#141B2D]/40 to-[#080C14] hover:from-[#141B2D]/70 cursor-pointer transition-all duration-300 group"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 group-hover:border-rose-500/40 transition-all">
                            <Upload className="w-8 h-8" />
                          </div>
                          <span className="text-sm font-bold text-slate-200 group-hover:text-rose-200 transition-colors">
                            Click to Browse or Drag & Drop Manuscript PDF
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            Accepts <strong className="text-rose-300">.pdf</strong> format directly from your device
                          </span>
                          <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Zero-Download DRM Shield Activated</span>
                          </div>
                        </label>
                      ) : (
                        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#141B2D] to-[#080C14] border-2 border-rose-500/40 space-y-4 shadow-xl">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-bold text-rose-100 truncate">
                                  {manuscriptFile.name}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  Size: {(manuscriptFile.size / (1024 * 1024)).toFixed(2)} MB • Format: PDF Document
                                </p>
                              </div>
                            </div>

                            <label
                              htmlFor="manuscript-file-input"
                              className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer shrink-0 font-semibold"
                            >
                              Change File
                            </label>
                          </div>

                          <div className="p-3 bg-[#080C14] border border-[#1E293E] rounded-xl flex items-center gap-2 text-xs text-slate-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              Ready to encrypt and store in private DRM storage for <strong>{selectedBookForChapters.title}</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload Notifications */}
                    {uploadMsg && (
                      <div
                        className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                          uploadMsg.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {uploadMsg.type === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1.5 flex-1">
                          <p className="font-semibold">{uploadMsg.text}</p>
                          {uploadMsg.details && (
                            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-emerald-500/20">
                              <p>File Name: <span className="font-mono text-emerald-200">{uploadMsg.details.fileName}</span></p>
                              <p>File Size: <span className="font-mono text-emerald-200">{uploadMsg.details.fileSizeMb} MB</span></p>
                              <p>Pages Verified: <span className="font-mono text-emerald-200">{uploadMsg.details.pageCount > 0 ? uploadMsg.details.pageCount : 'Multiple'}</span></p>
                              <div className="pt-2">
                                <Link
                                  href={`/read/${selectedBookForChapters.slug}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Verify in Canvas Reader</span>
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload Action Button */}
                    <button
                      type="submit"
                      disabled={uploadingPdf || !manuscriptFile}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2 tracking-wider uppercase"
                    >
                      {uploadingPdf ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>ENCRYPTING & STORING IN DRM VAULT...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>UPLOAD & SECURE MANUSCRIPT (.PDF)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* 2. ANTI-HACKER & DRM PROTECTION OVERVIEW (SECONDARY) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Security Architecture Card */}
                  <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-rose-100">
                        Anti-Hacker Security & DRM
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your uploaded manuscript is shielded with strict multi-layered security preventing unauthorized downloads via code, scripts, or scraping tools:
                    </p>

                    <div className="space-y-3.5 text-xs">
                      {/* Shield 1 */}
                      <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1A2336] space-y-1">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>1. Zero Public Storage Exposure</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Files are stored in <code className="text-slate-200">private_manuscripts/</code> outside the public web root. Direct URL downloads or web crawlers cannot reach raw files.
                        </p>
                      </div>

                      {/* Shield 2 */}
                      <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1A2336] space-y-1">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>2. Zero-Download Canvas Reader</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          PDFs are decoded in-memory and painted page-by-page onto an HTML5 <code className="text-slate-200">&lt;canvas&gt;</code>. No <code className="text-slate-200">&lt;embed&gt;</code>, <code className="text-slate-200">&lt;iframe&gt;</code>, or downloadable PDF links exist in the DOM.
                        </p>
                      </div>

                      {/* Shield 3 */}
                      <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1A2336] space-y-1">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          <span>3. Anti-cURL & Anti-Hotlinking Headers</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Streaming endpoint validates Origin and Referer. Enforces <code className="text-slate-200">no-store, no-cache, nosniff, X-Frame-Options: DENY</code>, and <code className="text-slate-200">X-Download-Options: noopen</code>.
                        </p>
                      </div>

                      {/* Shield 4 */}
                      <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#1A2336] space-y-1">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>4. Anti-DevTools Blackout & Forensic Watermark</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          If DevTools, F12, or Snipping Tool is triggered, the canvas instantly whites out or turns pitch-black and purges clipboard data.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Chapters Toggle Button */}
                  <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-rose-100">
                          Manual Text Chapters
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {selectedBookForChapters.chapters?.length || 0} text chapters in database
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowChapterTextForm(!showChapterTextForm)}
                        className="py-2 px-3.5 rounded-xl bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 font-bold text-xs transition-all"
                      >
                        {showChapterTextForm ? 'Hide Manual Form' : 'Manage Chapters'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXPANDABLE MANUAL CHAPTER TEXT MANAGEMENT */}
            {selectedBookForChapters && showChapterTextForm && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-[#1A2336]">
                <div className="lg:col-span-6 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-rose-100">
                      Add Chapter for &ldquo;{selectedBookForChapters.title}&rdquo;
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter chapter number, title, and raw manuscript text content
                    </p>
                  </div>

                  <form onSubmit={handleSaveChapter} className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Chapter No.</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={chapterFormData.chapterNumber}
                          onChange={(e) => setChapterFormData({ ...chapterFormData, chapterNumber: parseInt(e.target.value) })}
                          className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-300 font-bold block mb-1">Chapter Title</label>
                        <input
                          type="text"
                          required
                          value={chapterFormData.title}
                          onChange={(e) => setChapterFormData({ ...chapterFormData, title: e.target.value })}
                          placeholder="e.g. Chapter 1: The Quiet Midnight"
                          className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Manuscript Text Content</label>
                      <textarea
                        rows={8}
                        required
                        value={chapterFormData.content}
                        onChange={(e) => setChapterFormData({ ...chapterFormData, content: e.target.value })}
                        placeholder="Paste raw text manuscript..."
                        className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-serif leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{saving ? 'ADDING CHAPTER...' : 'SAVE & ADD CHAPTER'}</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-rose-100">Existing Chapters</h3>
                    <p className="text-xs text-slate-400">
                      Total: {selectedBookForChapters.chapters?.length || 0} Chapters in Database
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {selectedBookForChapters.chapters && selectedBookForChapters.chapters.length > 0 ? (
                      selectedBookForChapters.chapters.map((chap: any) => (
                        <div
                          key={chap.id}
                          className="bg-[#080C14] border border-[#1A2336] rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">
                              Chapter {chap.chapterNumber}
                            </span>
                            <h4 className="font-serif text-sm font-bold text-rose-100">{chap.title}</h4>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No text chapters created for this book yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PROMO COUPONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
            <div className="lg:col-span-5 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-rose-100">Create New Coupon Code</h3>
                <p className="text-xs text-slate-400">
                  Generate promotional discount codes for readers
                </p>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponFormData.code}
                    onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LOVE50"
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 uppercase font-mono tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Discount Type</label>
                    <select
                      value={couponFormData.discountType}
                      onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value })}
                      className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      value={couponFormData.discountValue}
                      onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: parseFloat(e.target.value) })}
                      placeholder="e.g. 50"
                      className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    value={couponFormData.maxUses}
                    onChange={(e) => setCouponFormData({ ...couponFormData, maxUses: parseInt(e.target.value) })}
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  <span>{saving ? 'CREATING...' : 'CREATE COUPON'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <h3 className="font-serif text-xl font-bold text-rose-100">Active Coupons ({coupons.length})</h3>

              {coupons.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#080C14] text-rose-300 font-serif border-b border-[#1E293E] uppercase">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Uses</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C2638]">
                      {coupons.map((c) => (
                        <tr key={c.id} className="hover:bg-black/20">
                          <td className="p-3 font-mono font-bold text-rose-300">{c.code}</td>
                          <td className="p-3 font-bold text-emerald-400">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </td>
                          <td className="p-3 text-slate-400">{c.usedCount} / {c.maxUses || '∞'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyCouponCode(c.code)}
                                className="py-1 px-2.5 rounded-lg bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Copy coupon code"
                              >
                                {copiedCode === c.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedCode === c.code ? 'COPIED' : 'COPY'}</span>
                              </button>

                              <button
                                onClick={() => setCouponToDelete({ id: c.id, code: c.code })}
                                className="py-1 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Remove coupon permanently"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>REMOVE</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No coupons created yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PENDING PAYMENT PROOFS & APPROVALS */}
        {/* ========================================================================= */}
        {activeTab === 'approvals' && (
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293E] pb-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Pending Payment Approvals & Proofs</span>
                  {pendingList.length > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      {pendingList.length} Awaiting Verification
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Readers who submitted their 12-digit UTR and payment screenshot. Approving here instantly unlocks the book for them and sends a confirmation email.
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="px-3.5 py-2 rounded-xl bg-[#161F31] border border-[#283652] hover:border-amber-500/50 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh List</span>
              </button>
            </div>

            {pendingList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingList.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="bg-[#080C14] border border-[#1E293E] hover:border-amber-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-lg"
                  >
                    {/* Header: Book Title & Price */}
                    <div className="flex items-start gap-3">
                      <img
                        src={purchase.book?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'}
                        alt={purchase.book?.title}
                        className="w-14 h-20 object-cover rounded-lg border border-[#283652] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          NEEDS APPROVAL
                        </span>
                        <h4 className="font-serif text-base font-bold text-slate-100 truncate mt-1">
                          {purchase.book?.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Reader: <strong className="text-slate-200">{purchase.user?.name}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {purchase.user?.email}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif text-xl font-bold text-emerald-400">
                          ₹{purchase.amount}
                        </span>
                        <p className="text-[10px] text-slate-500">Amount Paid</p>
                      </div>
                    </div>

                    {/* UTR & Timestamp Box */}
                    <div className="bg-[#0E1422] rounded-xl p-3 border border-[#1E293E] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Submitted UTR / Ref No.
                        </span>
                        <span className="font-mono text-sm font-bold text-amber-300 tracking-wider">
                          {purchase.utrNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Submitted</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Payment Screenshot Preview */}
                    {purchase.paymentReceipt ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Payment Screenshot / Receipt
                        </span>
                        <div
                          onClick={() => setSelectedReceiptModal(purchase.paymentReceipt)}
                          className="relative group cursor-pointer border border-[#283652] hover:border-amber-400/60 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center h-36 transition-all"
                        >
                          <img
                            src={purchase.paymentReceipt}
                            alt="Payment Receipt"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-amber-300 gap-1.5 transition-opacity backdrop-blur-[2px]">
                            <Eye className="w-4 h-4" />
                            <span>Click to Zoom Receipt</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-500 italic text-center">
                        No screenshot file provided
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleProcessPurchase(purchase.id, 'approve')}
                        disabled={approvingPurchaseId === purchase.id}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {approvingPurchaseId === purchase.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>APPROVE & UNLOCK</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Reject payment proof for "${purchase.book?.title}" from ${purchase.user?.email}?`)) {
                            handleProcessPurchase(purchase.id, 'reject');
                          }
                        }}
                        disabled={approvingPurchaseId === purchase.id}
                        className="py-2.5 px-4 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 font-bold text-xs transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 bg-[#080C14] rounded-2xl border border-[#1A2336]">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-200">
                  All Payments Verified & Up to Date!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When a reader pays via UPI and submits their receipt, it will appear right here and also ping your Gmail for instant 1-tap mobile approval.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PURCHASES LOG */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 font-sans">
            <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" />
              Real Money Digital Purchases & UTR Log
            </h2>

            {recentPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#080C14] text-rose-300 font-serif border-b border-[#1E293E] uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Reader Email</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">UPI UTR Ref</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {recentPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-black/20">
                        <td className="p-3 font-mono text-[11px] text-slate-400">{p.orderId}</td>
                        <td className="p-3 text-rose-200 font-medium">{p.user?.email || 'Reader'}</td>
                        <td className="p-3 font-serif text-rose-100 font-semibold">{p.book?.title}</td>
                        <td className="p-3 font-bold text-rose-300">₹{p.amount}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{p.utrNumber || 'N/A'}</td>
                        <td className="p-3 text-slate-400">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> VERIFIED UNLOCKED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No purchase logs recorded yet.</p>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: UPI & PAYMENT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293E] pb-5">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-100 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-rose-400" />
                    AUTHOR UPI & DIRECT PAYMENT CONFIGURATION
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Change the recipient UPI ID (VPA) and Author display name for all reader payments and QR code generation.
                  </p>
                </div>
              </div>

              {upiMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{upiMsg}</span>
                </div>
              )}

              {upiError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{upiError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column */}
                <form onSubmit={handleSaveUpiSettings} className="lg:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Author UPI ID (VPA Address)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={upiSettings.authorUpiId}
                        onChange={(e) => setUpiSettings({ ...upiSettings, authorUpiId: e.target.value.trim() })}
                        placeholder="e.g. mretyunjai006@oksbi or yourname@okicici"
                        className="w-full bg-[#080C14] border border-[#263550] focus:border-rose-500 rounded-2xl p-3.5 text-rose-100 font-mono text-sm shadow-inner"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This UPI address will be encoded into all payment QR codes across GPay, PhonePe, and Paytm. All direct transfers arrive immediately into your linked bank account with 0% gateway commission.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Beneficiary / Author Payee Name
                    </label>
                    <input
                      type="text"
                      required
                      value={upiSettings.authorName}
                      onChange={(e) => setUpiSettings({ ...upiSettings, authorName: e.target.value })}
                      placeholder="e.g. Mretyun Jai B"
                      className="w-full bg-[#080C14] border border-[#263550] focus:border-rose-500 rounded-2xl p-3.5 text-slate-200 text-sm shadow-inner"
                    />
                    <p className="text-[11px] text-slate-400">
                      The payee name shown to readers when opening their UPI app on mobile.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={savingUpi}
                      className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingUpi ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>SAVING SETTINGS...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>SAVE & UPDATE ALL READER CHECKOUTS</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Live QR Preview Column */}
                <div className="lg:col-span-5 bg-[#080C14] border border-[#1A2336] rounded-3xl p-6 text-center space-y-4 shadow-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <QrCode className="w-3.5 h-3.5 text-rose-400" />
                    LIVE QR CODE PREVIEW
                  </div>
                  
                  <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-rose-500/30">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `upi://pay?pa=${upiSettings.authorUpiId}&pn=${encodeURIComponent(
                          upiSettings.authorName
                        )}&am=199&cu=INR&tn=STORYVAULT%20TEST`
                      )}`}
                      alt="UPI QR Code Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-mono text-rose-300 font-bold break-all">
                      {upiSettings.authorUpiId}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Payee: <strong className="text-slate-200">{upiSettings.authorName}</strong>
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-[#0E1422] p-3 rounded-xl border border-[#1E293E] text-left space-y-1">
                    <p className="font-semibold text-slate-300">⚡ Instant Synchronization:</p>
                    <p>When you click Save, all readers opening the purchase modal on any book will instantly see the new QR code pointing to this UPI ID.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: READERS & USER ACCOUNTS */}
        {activeTab === 'readers' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293E] pb-5">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-rose-100 flex items-center gap-2">
                    <Users className="w-6 h-6 text-rose-400" />
                    REGISTERED READERS & USER ACCOUNTS
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage reader accounts, monitor reading activity and unlocked books, or permanently delete accounts.
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full self-start sm:self-auto">
                  {readersListState.length} Total Accounts
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={readerSearchQuery}
                  onChange={(e) => setReaderSearchQuery(e.target.value)}
                  placeholder="Search reader name, email, or nickname..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl pl-10 pr-16 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                />
                {readerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReaderSearchQuery('')}
                    className="text-[10px] text-slate-400 hover:text-rose-300 absolute right-3.5 top-1/2 -translate-y-1/2 uppercase font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Table / List */}
              <div className="space-y-3">
                {filteredReaders.length > 0 ? (
                  filteredReaders.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#080C14] border border-[#1A2336] hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-500/10 border border-rose-500/20 shrink-0 flex items-center justify-center">
                          {r.avatar ? (
                            <img
                              src={r.avatar}
                              alt={r.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="font-serif font-bold text-base text-rose-300">
                              {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif text-sm font-bold text-rose-100 truncate">
                              {r.name || 'Unnamed Reader'}
                            </h4>
                            {r.nickname && (
                              <span className="text-[10px] text-rose-300/80 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                                @{r.nickname}
                              </span>
                            )}
                            {r.role === 'ADMIN' ? (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                ADMIN
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                READER
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate font-mono text-xs text-slate-300">{r.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1A2336]">
                        <div className="text-left sm:text-right text-xs">
                          <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">
                            {r._count?.purchases ?? 0} {r._count?.purchases === 1 ? 'Book' : 'Books'} Unlocked
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Joined {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {r.role !== 'ADMIN' ? (
                          <button
                            type="button"
                            onClick={() => setUserToDelete({ id: r.id, name: r.name, email: r.email, role: r.role })}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-100 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                            title={`Delete account for ${r.name || r.email}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Account</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic px-2">
                            Protected Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-[#080C14] rounded-2xl border border-[#1A2336] text-xs text-slate-400">
                    No registered readers found matching &ldquo;{readerSearchQuery}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT BOOK MODAL */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1E293E] pb-4">
              <h3 className="font-serif text-xl font-bold text-rose-100">
                {editingBook ? `Edit "${editingBook.title}"` : 'Add New Published Book'}
              </h3>
              <button onClick={() => setShowAddBookModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                  placeholder="e.g. Can Love Survive?"
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={bookFormData.slug}
                  onChange={(e) => setBookFormData({ ...bookFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. can-love-survive"
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold block">Description / Full Synopsis</label>
                  <span className="text-[11px] text-slate-500">
                    {bookFormData.description.length} characters
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  placeholder="Enter detailed multi-paragraph book description and narrative synopsis. Paragraphs and line breaks are fully formatted on the book page."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3.5 text-slate-200 font-sans leading-relaxed text-xs sm:text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Multiple paragraphs and line breaks are supported and displayed cleanly on the book details page to balance out cover space.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Genre / Category</label>
                  <input
                    type="text"
                    required
                    value={bookFormData.genre}
                    onChange={(e) => setBookFormData({ ...bookFormData, genre: e.target.value })}
                    placeholder="e.g. Romantic Drama, Emotional Romance"
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Digital Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookFormData.digitalPrice}
                    onChange={(e) => setBookFormData({ ...bookFormData, digitalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Cover Image URL</label>
                <input
                  type="text"
                  required
                  value={bookFormData.coverImage}
                  onChange={(e) => setBookFormData({ ...bookFormData, coverImage: e.target.value })}
                  placeholder="/can-love-survive.jpg or https://images.unsplash.com/..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1E293E]">
                <label className="text-slate-300 font-bold block">Paperback Purchase Link (Pothi.com)</label>
                <input
                  type="url"
                  value={bookFormData.paperbackLink}
                  onChange={(e) => setBookFormData({ ...bookFormData, paperbackLink: e.target.value })}
                  placeholder="https://pothi.com/pothi/book/..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Hardcover Purchase Link (Pothi.com)</label>
                <input
                  type="url"
                  value={bookFormData.hardcoverLink}
                  onChange={(e) => setBookFormData({ ...bookFormData, hardcoverLink: e.target.value })}
                  placeholder="https://pothi.com/pothi/book/..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">Kindle Edition Link (Amazon)</label>
                <input
                  type="url"
                  value={bookFormData.kindleLink}
                  onChange={(e) => setBookFormData({ ...bookFormData, kindleLink: e.target.value })}
                  placeholder="https://amazon.in/dp/..."
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="py-3 px-5 rounded-xl border border-[#283652] text-slate-300 font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-lg"
                >
                  {saving ? 'SAVING...' : 'SAVE BOOK DETAILS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BOOK CONFIRMATION MODAL */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-[#0E1422] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-bold text-rose-100">
                  Delete Book?
                </h3>
                <p className="text-xs text-rose-300 font-semibold truncate">
                  &ldquo;{bookToDelete.title}&rdquo;
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#080C14] p-4 rounded-2xl border border-[#1A2336]">
              Are you sure you want to permanently delete this book? This will cleanly remove the book, its associated chapter manuscripts, bookmarks, and reader progress from the database. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setBookToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#283652] text-slate-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteBook}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-wider cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Book</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE COUPON MODAL */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-[#0E1422] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-bold text-rose-100">
                  Remove Coupon?
                </h3>
                <p className="text-xs text-rose-300 font-semibold truncate font-mono">
                  {couponToDelete.code}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#080C14] p-4 rounded-2xl border border-[#1A2336]">
              Are you sure you want to permanently delete coupon <strong className="text-rose-300 font-mono">{couponToDelete.code}</strong>? Readers will no longer be able to apply this discount code at checkout.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingCoupon}
                onClick={() => setCouponToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-[#283652] text-slate-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingCoupon}
                onClick={confirmDeleteCoupon}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-wider cursor-pointer"
              >
                {deletingCoupon ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Remove Coupon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTERED READERS MODAL DIALOG */}
      {showReadersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans animate-fade-in">
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#1A2336] pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2.5">
                    <span>Registered Readers Directory</span>
                    <span className="text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                      {readersList.length} Accounts
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Accounts, profile nicknames, verified emails, and unlocked library titles
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReadersModal(false)}
                className="w-9 h-9 rounded-xl bg-[#141B2D] border border-[#283652] hover:border-rose-500/50 text-slate-400 hover:text-rose-200 flex items-center justify-center transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={readerSearchQuery}
                onChange={(e) => setReaderSearchQuery(e.target.value)}
                placeholder="Search reader name, email, or nickname..."
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl pl-10 pr-16 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
              />
              {readerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReaderSearchQuery('')}
                  className="text-[10px] text-slate-400 hover:text-rose-300 absolute right-3.5 top-1/2 -translate-y-1/2 uppercase font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Readers Card List */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {filteredReaders.length > 0 ? (
                filteredReaders.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-[#080C14] border border-[#1A2336] hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-500/10 border border-rose-500/20 shrink-0 flex items-center justify-center">
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt={r.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-serif font-bold text-base text-rose-300">
                            {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                          </span>
                        )}
                      </div>

                      {/* Name & Email Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif text-sm font-bold text-rose-100 truncate">
                            {r.name || 'Unnamed Reader'}
                          </h4>
                          {r.nickname && (
                            <span className="text-[10px] text-rose-300/80 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                              @{r.nickname}
                            </span>
                          )}
                          {r.role === 'ADMIN' ? (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ADMIN
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              READER
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate font-mono text-[11px] text-slate-300">{r.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left sm:text-right text-xs">
                        <span className="text-[10px] font-bold text-rose-400 block uppercase tracking-wider">
                          {r._count?.purchases ?? 0} {r._count?.purchases === 1 ? 'Book' : 'Books'} Unlocked
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Joined {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {r.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete({ id: r.id, name: r.name, email: r.email, role: r.role })}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 hover:text-rose-200 transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                          title={`Delete account for ${r.name || r.email}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-[#080C14] rounded-2xl border border-[#1A2336] text-xs text-slate-400">
                  No registered readers found matching &ldquo;{readerSearchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#1A2336] flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Showing {filteredReaders.length} of {readersList.length} registered accounts</span>
              <button
                type="button"
                onClick={() => setShowReadersModal(false)}
                className="px-4 py-2 rounded-xl bg-[#161F31] border border-[#283652] hover:border-rose-500/50 text-rose-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT ZOOM MODAL */}
      {selectedReceiptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedReceiptModal(null)}
        >
          <div
            className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-2xl w-full p-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293E]">
              <h3 className="font-serif text-base font-bold text-rose-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Payment Screenshot Proof</span>
              </h3>
              <button
                onClick={() => setSelectedReceiptModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2638] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-black/50 rounded-xl p-2 border border-[#1A2336]">
              <img
                src={selectedReceiptModal}
                alt="Enlarged Receipt Screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceiptModal(null)}
                className="px-5 py-2 rounded-xl bg-[#161F31] border border-[#283652] hover:border-rose-500/50 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => !deletingUser && setUserToDelete(null)}
        >
          <div
            className="bg-[#0E1422] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/10">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-xl font-bold text-rose-100">
                Delete User Account?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete the account of{' '}
                <strong className="text-rose-300">{userToDelete.name || userToDelete.email}</strong> (
                <span className="font-mono text-slate-400">{userToDelete.email}</span>)?
              </p>
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-[11px] text-rose-300/90 text-left space-y-1 mt-3">
                <p className="font-bold">⚠️ Warning: Irreversible Action</p>
                <p>This will permanently remove the user&apos;s credentials, all unlocked book purchases, bookmarks, and reading history.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-[#141B2D] border border-[#283652] hover:border-slate-500 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}