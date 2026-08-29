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
  ExternalLink,
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
  books: initialBooks,
  seriesList,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'books' | 'chapters' | 'coupons' | 'orders'>('analytics');
  const [booksList, setBooksList] = useState(initialBooks);

  // Book Form State with Editable Genre & Total Chapters
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    slug: '',
    description: '',
    genre: 'Romantic Drama',
    totalChapters: 8,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    digitalPrice: 199,
    paperbackEnabled: true,
    paperbackLink: '',
    paperbackPublisher: 'Pothi Publishing (pothi.com)',
    hardcoverEnabled: true,
    hardcoverLink: '',
    hardcoverPublisher: 'Pothi Publishing (pothi.com)',
  });

  // Chapter Form State
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<any>(booksList[0] || null);
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

  // Fetch Coupons
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

  // Handle Save Book (Create or Edit)
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
    } catch (err: any) {
      setMsg('Network error saving book.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/books?id=${bookId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBooksList((prev) => prev.filter((b) => b.id !== bookId));
        alert(`"${bookTitle}" has been deleted.`);
      } else {
        alert('Failed to delete book.');
      }
    } catch (err) {
      alert('Error deleting book.');
    }
  };

  const handleEditBookClick = (book: any) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      slug: book.slug,
      description: book.description || '',
      genre: book.genre || 'Romantic Drama',
      totalChapters: book.totalChapters || book.chapters?.length || 8,
      coverImage: book.coverImage,
      digitalPrice: book.digitalPrice,
      paperbackEnabled: book.paperbackEnabled,
      paperbackLink: book.paperbackLink || '',
      paperbackPublisher: book.paperbackPublisher || 'Pothi Publishing (pothi.com)',
      hardcoverEnabled: book.hardcoverEnabled,
      hardcoverLink: book.hardcoverLink || '',
      hardcoverPublisher: book.hardcoverPublisher || 'Pothi Publishing (pothi.com)',
    });
    setShowAddBookModal(true);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              AUTHOR & ADMIN PANEL
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-rose-100 uppercase tracking-wide">
              THE STORY LIBRARY MANAGEMENT
            </h1>
            <p className="text-xs text-slate-400">
              Manage published books, chapter manuscripts, coupon codes, and sales analytics
            </p>
          </div>

          {/* TABS */}
          <div className="flex flex-wrap items-center gap-2 bg-[#080C14] p-1.5 rounded-2xl border border-[#1A2336]">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              onClick={() => setActiveTab('chapters')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chapters'
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
          </div>
        </div>

        {msg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs font-bold text-rose-300 text-center">
            {msg}
          </div>
        )}

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">TOTAL REVENUE</span>
                <p className="font-serif text-3xl font-bold text-rose-300">₹{stats.totalRevenue}</p>
                <p className="text-[11px] text-slate-400">Verified Digital Access Sales</p>
              </div>

              <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">TOTAL DIGITAL PURCHASES</span>
                <p className="font-serif text-3xl font-bold text-rose-100">{stats.totalPurchases}</p>
                <p className="text-[11px] text-slate-400">Books Unlocked</p>
              </div>

              <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">TOTAL READERS</span>
                <p className="font-serif text-3xl font-bold text-rose-100">{stats.totalUsers}</p>
                <p className="text-[11px] text-slate-400">Registered Accounts</p>
              </div>

              <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl p-6 shadow-xl space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">PUBLISHED BOOKS</span>
                <p className="font-serif text-3xl font-bold text-rose-100">{stats.totalBooks}</p>
                <p className="text-[11px] text-slate-400">Live Titles in Catalog</p>
              </div>
            </div>
          </div>
        )}

	{/* TAB 3: MANUSCRIPTS & CHAPTER MANAGEMENT */}
{activeTab === 'chapters' && (
  <div className="space-y-8 font-sans">
    
    {/* BOOK SELECTOR DROPDOWN */}
    <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 shadow-xl space-y-3">
      <label className="text-xs font-bold text-rose-300 uppercase tracking-widest block">
        Select Book to Manage Manuscripts & Chapters
      </label>
      <select
        value={selectedBookForChapters?.id || ''}
        onChange={(e) => {
          const found = booksList.find((b) => b.id === e.target.value);
          setSelectedBookForChapters(found || null);
        }}
        className="w-full sm:w-1/2 bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-serif text-base"
      >
        {booksList.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title} ({b.genre || 'Romantic Drama'})
          </option>
        ))}
      </select>
    </div>

    {selectedBookForChapters && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ADD / EDIT CHAPTER FORM */}
        <div className="lg:col-span-6 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-rose-100">
              Add New Chapter for &ldquo;{selectedBookForChapters.title}&rdquo;
            </h3>
            <p className="text-xs text-slate-400">
              Enter chapter number, title, and manuscript text content
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
                rows={10}
                required
                value={chapterFormData.content}
                onChange={(e) => setChapterFormData({ ...chapterFormData, content: e.target.value })}
                placeholder="Paste the raw chapter text manuscript here..."
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-serif leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'ADDING CHAPTER...' : 'SAVE & ADD CHAPTER'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: EXISTING CHAPTERS LIST */}
        <div className="lg:col-span-6 bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-rose-100">Existing Chapters</h3>
              <p className="text-xs text-slate-400">
                Total: {selectedBookForChapters.chapters?.length || 0} Chapters in Database
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
              <p className="text-xs text-slate-400 italic">No chapters created for this book yet.</p>
            )}
          </div>
        </div>

      </div>
    )}

  </div>
)}

        {/* TAB 2: MANAGE BOOKS WITH EDITABLE GENRE & CHAPTERS */}
        {activeTab === 'books' && (
          <div className="space-y-6">
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
                    totalChapters: 8,
                    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
                    digitalPrice: 199,
                    paperbackEnabled: true,
                    paperbackLink: '',
                    paperbackPublisher: 'Pothi Publishing (pothi.com)',
                    hardcoverEnabled: true,
                    hardcoverLink: '',
                    hardcoverPublisher: 'Pothi Publishing (pothi.com)',
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
                        <span>Chapters: {book.totalChapters || book.chapters?.length || 8}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS: EDIT DETAILS & RED DELETE BUTTON */}
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

      </div>

      {/* ADD / EDIT BOOK MODAL WITH EDITABLE GENRE & TOTAL CHAPTERS */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto font-sans">
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
                <label className="text-slate-300 font-bold block mb-1">Description / Synopsis</label>
                <textarea
                  rows={3}
                  required
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                />
              </div>

              {/* EDITABLE GENRE & EDITABLE CHAPTER COUNT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="text-slate-300 font-bold block mb-1">Total Chapters Count</label>
                  <input
                    type="number"
                    required
                    value={bookFormData.totalChapters}
                    onChange={(e) => setBookFormData({ ...bookFormData, totalChapters: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 8"
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Digital Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookFormData.digitalPrice}
                    onChange={(e) => setBookFormData({ ...bookFormData, digitalPrice: parseFloat(e.target.value) })}
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

    </div>
  );
}