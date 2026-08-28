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
  X,
  Trash2,
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
  books: any[];
  seriesList: any[];
}

export default function AdminDashboardClient({
  stats,
  recentPurchases,
  books,
  seriesList,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'books' | 'chapters' | 'coupons' | 'orders'>('analytics');
  
  // Book Form State
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    slug: '',
    description: '',
    genre: 'Romantic Drama',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    digitalPrice: 199,
    digitalEnabled: true,
    paperbackEnabled: true,
    paperbackLink: '',
    paperbackPublisher: 'Pothi Publishing',
    hardcoverEnabled: true,
    hardcoverLink: '',
    hardcoverPublisher: 'Amazon Hardcover',
    kindleEnabled: true,
    kindleLink: '',
    kindlePublisher: 'Amazon Kindle',
  });

  // Chapter Form State
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<any>(books[0] || null);
  const [chapterFormData, setChapterFormData] = useState({
    chapterNumber: 1,
    title: '',
    content: '',
  });

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

  // Fetch Coupons when tab becomes active
  useEffect(() => {
    if (activeTab === 'coupons') {
      fetch('/api/admin/coupons')
        .then((res) => res.json())
        .then((data) => {
          if (data.coupons) setCoupons(data.coupons);
        })
        .catch((err) => console.error(err));
    }
  }, [activeTab]);

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
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

      setMsg(`Coupon code '${data.coupon.code}' created successfully!`);
      setCoupons((prev) => [data.coupon, ...prev]);
      setCouponFormData({ code: '', discountType: 'PERCENTAGE', discountValue: 50, maxUses: 100, bookId: '' });
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const isEdit = !!editingBook;
      const url = '/api/admin/books';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: editingBook.id, ...bookFormData } : bookFormData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save book');

      setMsg(`Book ${isEdit ? 'updated' : 'created'} successfully!`);
      setShowAddBookModal(false);
      setEditingBook(null);
      window.location.reload();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'Failed to add chapter');

      setMsg('Chapter added successfully!');
      setChapterFormData({ chapterNumber: chapterFormData.chapterNumber + 1, title: '', content: '' });
      window.location.reload();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openEditBook = (book: any) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      slug: book.slug,
      description: book.description,
      genre: book.genre,
      coverImage: book.coverImage,
      digitalPrice: book.digitalPrice,
      digitalEnabled: book.digitalEnabled,
      paperbackEnabled: book.paperbackEnabled,
      paperbackLink: book.paperbackLink || '',
      paperbackPublisher: book.paperbackPublisher || 'Pothi Publishing',
      hardcoverEnabled: book.hardcoverEnabled,
      hardcoverLink: book.hardcoverLink || '',
      hardcoverPublisher: book.hardcoverPublisher || 'Amazon Hardcover',
      kindleEnabled: book.kindleEnabled,
      kindleLink: book.kindleLink || '',
      kindlePublisher: book.kindlePublisher || 'Amazon Kindle',
    });
    setShowAddBookModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ADMIN HEADER */}
        <div className="bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Shield className="w-3.5 h-3.5" />
              AUTHOR & ADMIN PANEL
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-amber-100 tracking-wide">
              THE STORY LIBRARY MANAGEMENT
            </h1>
            <p className="text-xs text-slate-400">
              Manage published books, chapter manuscripts, coupon codes, and sales analytics
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0B0F19] p-1.5 rounded-2xl border border-[#222F45]">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ANALYTICS</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'books'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MANAGE BOOKS</span>
            </button>

            <button
              onClick={() => setActiveTab('chapters')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chapters'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MANUSCRIPTS</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'coupons'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>COUPONS</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>PURCHASES</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs font-bold text-amber-200">
            {msg}
          </div>
        )}

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-[#121826] border border-[#232F47] rounded-2xl p-6 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Revenue
                </span>
                <span className="font-serif text-3xl font-bold text-amber-300">
                  ₹{stats.totalRevenue.toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500">Verified Digital Access Sales</p>
              </div>

              <div className="bg-[#121826] border border-[#232F47] rounded-2xl p-6 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Digital Purchases
                </span>
                <span className="font-serif text-3xl font-bold text-amber-100">
                  {stats.totalPurchases}
                </span>
                <p className="text-[11px] text-slate-500">Books Unlocked</p>
              </div>

              <div className="bg-[#121826] border border-[#232F47] rounded-2xl p-6 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Readers
                </span>
                <span className="font-serif text-3xl font-bold text-amber-100">
                  {stats.totalUsers}
                </span>
                <p className="text-[11px] text-slate-500">Registered Accounts</p>
              </div>

              <div className="bg-[#121826] border border-[#232F47] rounded-2xl p-6 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Published Books
                </span>
                <span className="font-serif text-3xl font-bold text-amber-100">
                  {stats.totalBooks}
                </span>
                <p className="text-[11px] text-slate-500">Active Titles</p>
              </div>

            </div>

            {/* Recent Sales Table */}
            <div className="bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <h2 className="font-serif text-lg font-bold text-amber-100">Recent Purchase Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0F19] text-amber-300 font-serif border-b border-[#232F47] uppercase">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {recentPurchases.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-semibold text-amber-200">{p.user.name} ({p.user.email})</td>
                        <td className="p-3 font-serif font-bold text-slate-200">{p.book.title}</td>
                        <td className="p-3 text-amber-300 font-bold">₹{p.amount}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{p.orderId}</td>
                        <td className="p-3 text-slate-400" suppressHydrationWarning>
                          {p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE BOOKS */}
        {activeTab === 'books' && (
          <div className="space-y-8">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-amber-100">Book Catalog Management</h2>
                <p className="text-xs text-slate-400">Set digital reading prices and external publisher links for Paperback/Hardcover</p>
              </div>

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
                    digitalEnabled: true,
                    paperbackEnabled: true,
                    paperbackLink: '',
                    paperbackPublisher: 'Pothi Publishing',
                    hardcoverEnabled: true,
                    hardcoverLink: '',
                    hardcoverPublisher: 'Amazon Hardcover',
                    kindleEnabled: true,
                    kindleLink: '',
                    kindlePublisher: 'Amazon Kindle',
                  });
                  setShowAddBookModal(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>ADD NEW BOOK</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-[#121826] border border-[#232F47] rounded-2xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-20 aspect-[2/3] object-cover rounded-lg border border-[#2A364F]"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        {book.genre}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-amber-100">{book.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{book.description}</p>

                      <div className="pt-2 text-xs text-amber-300 font-bold">
                        Digital Access Price: ₹{book.digitalPrice}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0B0F19] p-3 rounded-xl border border-[#1C2638] text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Paperback Link:</span>
                      <span className="text-amber-400 font-mono truncate max-w-xs">{book.paperbackLink || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Hardcover Link:</span>
                      <span className="text-amber-400 font-mono truncate max-w-xs">{book.hardcoverLink || 'Not set'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => openEditBook(book)}
                      className="py-2 px-4 rounded-lg bg-[#182236] border border-[#2E3C54] hover:border-amber-500 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>EDIT DETAILS & LINKS</span>
                    </button>
                    <span className="text-xs text-slate-500 font-semibold">{book.chapters?.length || 0} Chapters</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: CHAPTER MANUSCRIPT EDITOR & FILE UPLOAD */}
        {activeTab === 'chapters' && (
          <div className="bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
            <div>
              <h2 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Manuscript File Upload & Chapter Content Editor
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload full book manuscripts in Word (.docx), PDF (.pdf), or Text (.txt) formats. The platform automatically extracts text and creates structured chapters!
              </p>
            </div>

            {/* SECTION A: DIRECT MANUSCRIPT FILE UPLOAD (.PDF / .DOCX / .TXT) */}
            <div className="bg-[#0B0F19] border-2 border-dashed border-amber-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-200">
                    Upload Complete Manuscript File (.docx, .pdf, .txt)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload your raw book manuscript. Our system will split chapters automatically.
                  </p>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const fileInput = target.elements.manuscriptFile;
                  if (!fileInput.files[0] || !selectedBookForChapters) {
                    alert('Please select a book and a manuscript file!');
                    return;
                  }
                  setSaving(true);
                  setMsg('Uploading & parsing manuscript text...');

                  const formData = new FormData();
                  formData.append('file', fileInput.files[0]);
                  formData.append('bookId', selectedBookForChapters.id);

                  try {
                    const res = await fetch('/api/admin/upload-manuscript', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to upload manuscript');

                    setMsg(data.message);
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (err: any) {
                    setMsg(`Error: ${err.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-sans text-xs"
              >
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Select Target Book</label>
                  <select
                    value={selectedBookForChapters?.id || ''}
                    onChange={(e) => {
                      const b = books.find((x) => x.id === e.target.value);
                      setSelectedBookForChapters(b);
                    }}
                    className="w-full bg-[#121826] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Choose Manuscript File (.docx / .pdf / .txt)</label>
                  <input
                    name="manuscriptFile"
                    type="file"
                    accept=".docx,.doc,.pdf,.txt"
                    required
                    className="w-full bg-[#121826] border border-[#2A364F] rounded-xl p-2 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2D] hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg transition-all"
                  >
                    {saving ? 'PARSING MANUSCRIPT...' : 'UPLOAD & AUTO-SPLIT MANUSCRIPT'}
                  </button>
                </div>
              </form>
            </div>

            {/* SECTION B: MANUAL CHAPTER EDITOR */}
            <div className="space-y-4 pt-4 border-t border-[#1C2638]">
              <h3 className="font-serif text-base font-bold text-slate-200">
                Manual Chapter Editor & Text Modifier
              </h3>

              {selectedBookForChapters && (
                <form onSubmit={handleSaveChapter} className="space-y-4 font-sans text-xs max-w-2xl">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold uppercase block mb-1">Chapter Number</label>
                      <input
                        type="number"
                        required
                        value={chapterFormData.chapterNumber}
                        onChange={(e) => setChapterFormData((prev) => ({ ...prev, chapterNumber: parseInt(e.target.value) }))}
                        className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-300 font-bold uppercase block mb-1">Chapter Title</label>
                      <input
                        type="text"
                        required
                        value={chapterFormData.title}
                        onChange={(e) => setChapterFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Chapter 9: The Long Walk Home"
                        className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold uppercase block mb-1">Chapter Content Text (Markdown / Paragraphs)</label>
                    <textarea
                      required
                      rows={10}
                      value={chapterFormData.content}
                      onChange={(e) => setChapterFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Paste full manuscript chapter text here..."
                      className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-3 text-slate-200 font-serif leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg"
                  >
                    {saving ? 'Publishing Chapter...' : 'PUBLISH NEW CHAPTER'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COUPON MANAGEMENT */}
        {activeTab === 'coupons' && (
          <div className="space-y-8">
            
            <div className="bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-amber-100 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  Generate Promo & Discount Coupon Codes
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create discount codes for readers. Admin can copy and share these codes with readers.
                </p>
              </div>

              {/* Form to Create Coupon */}
              <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-[#0B0F19] p-5 rounded-2xl border border-[#1F2B3E] font-sans text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponFormData.code}
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. LOVE50"
                    className="w-full bg-[#121826] border border-[#2A364F] rounded-xl p-2.5 text-slate-200 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Discount Type</label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, discountType: e.target.value }))}
                    className="w-full bg-[#121826] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
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
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                    placeholder="e.g. 50"
                    className="w-full bg-[#121826] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md"
                  >
                    {saving ? 'Creating...' : 'CREATE COUPON'}
                  </button>
                </div>
              </form>

              {/* Coupon Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B0F19] text-amber-300 font-serif border-b border-[#232F47] uppercase">
                    <tr>
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Uses</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-black/20">
                        <td className="p-3 font-mono font-bold text-amber-200 text-sm">
                          {c.code}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                        </td>
                        <td className="p-3 text-slate-400">
                          {c.usedCount} / {c.maxUses}
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            ACTIVE
                          </span>
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="py-1.5 px-3 rounded-lg bg-[#182236] border border-[#2E3C54] hover:border-amber-500 text-amber-300 text-[11px] font-bold flex items-center gap-1"
                          >
                            {copiedCode === c.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode === c.code ? 'COPIED' : 'COPY CODE'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* MODAL: ADD / EDIT BOOK */}
        {showAddBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121826] border border-[#232F47] rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative text-slate-100">
              
              <button
                onClick={() => setShowAddBookModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-serif text-xl font-bold text-amber-100 mb-6">
                {editingBook ? `Edit Book: ${editingBook.title}` : 'Add New Book'}
              </h3>

              <form onSubmit={handleSaveBook} className="space-y-4 font-sans text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={bookFormData.title}
                      onChange={(e) => setBookFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={bookFormData.slug}
                      onChange={(e) => setBookFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Short Description</label>
                  <textarea
                    required
                    rows={3}
                    value={bookFormData.description}
                    onChange={(e) => setBookFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Digital Reading Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={bookFormData.digitalPrice}
                      onChange={(e) => setBookFormData((prev) => ({ ...prev, digitalPrice: parseFloat(e.target.value) }))}
                      className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      required
                      value={bookFormData.coverImage}
                      onChange={(e) => setBookFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                      className="w-full bg-[#0B0F19] border border-[#2A364F] rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1C2638] space-y-4">
                  <h4 className="font-serif text-sm font-bold text-amber-300">Physical Edition Redirect Links</h4>
                  
                  <div className="grid grid-cols-2 gap-4 bg-[#0B0F19] p-3 rounded-xl border border-[#1F2B3E]">
                    <div>
                      <label className="text-slate-400 block mb-1">Paperback Publisher</label>
                      <input
                        type="text"
                        value={bookFormData.paperbackPublisher}
                        onChange={(e) => setBookFormData((prev) => ({ ...prev, paperbackPublisher: e.target.value }))}
                        className="w-full bg-[#121826] border border-[#2A364F] rounded-lg p-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Paperback External URL</label>
                      <input
                        type="text"
                        value={bookFormData.paperbackLink}
                        onChange={(e) => setBookFormData((prev) => ({ ...prev, paperbackLink: e.target.value }))}
                        placeholder="https://pothi.com/..."
                        className="w-full bg-[#121826] border border-[#2A364F] rounded-lg p-2 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#0B0F19] p-3 rounded-xl border border-[#1F2B3E]">
                    <div>
                      <label className="text-slate-400 block mb-1">Hardcover Publisher</label>
                      <input
                        type="text"
                        value={bookFormData.hardcoverPublisher}
                        onChange={(e) => setBookFormData((prev) => ({ ...prev, hardcoverPublisher: e.target.value }))}
                        className="w-full bg-[#121826] border border-[#2A364F] rounded-lg p-2 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Hardcover External URL</label>
                      <input
                        type="text"
                        value={bookFormData.hardcoverLink}
                        onChange={(e) => setBookFormData((prev) => ({ ...prev, hardcoverLink: e.target.value }))}
                        placeholder="https://amazon.in/..."
                        className="w-full bg-[#121826] border border-[#2A364F] rounded-lg p-2 text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBookModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-[#2E3C54] text-slate-300"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-6 rounded-xl bg-amber-500 text-slate-950 font-bold"
                  >
                    {saving ? 'Saving...' : 'SAVE BOOK'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
