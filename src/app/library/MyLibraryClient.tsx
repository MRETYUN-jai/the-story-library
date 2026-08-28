'use client';

import { useState } from 'react';
import Link from 'next/link';
import Bookshelf from '@/components/Bookshelf';
import { BookOpen, User as UserIcon, History, LogOut, ArrowRight, Sparkles, CheckCircle2, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MyLibraryClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  unlockedBooks: any[];
  lockedBooks: any[];
  lastReadBook?: any;
  purchases: any[];
}

export default function MyLibraryClient({
  user,
  unlockedBooks,
  lockedBooks,
  lastReadBook,
  purchases,
}: MyLibraryClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'books' | 'history' | 'account'>('books');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* DASHBOARD HEADER */}
        <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              READER DASHBOARD
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-rose-100 uppercase tracking-wide">
              WELCOME BACK, {user.name}
            </h1>
            <p className="text-xs text-slate-400 font-serif italic">
              {user.email} • Personal Account
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#080C14] p-1.5 rounded-2xl border border-[#1A2336]">
            <button
              onClick={() => setActiveTab('books')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'books'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MY BOOKS ({unlockedBooks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>PURCHASE HISTORY</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'account'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>ACCOUNT</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MY BOOKS & CONTINUE READING */}
        {activeTab === 'books' && (
          <div className="space-y-10">
            
            {/* CONTINUE READING HERO BANNER */}
            {lastReadBook && (
              <div className="bg-gradient-to-r from-[#171120] via-[#0E1422] to-[#1A0E18] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <img
                    src={lastReadBook.coverImage}
                    alt={lastReadBook.title}
                    className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-xl border border-rose-500/40 shadow-xl"
                  />
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <span className="text-[11px] font-bold text-rose-300 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                      CONTINUE READING
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100">
                      {lastReadBook.title}
                    </h2>
                    
                    <div className="space-y-1 max-w-sm mx-auto sm:mx-0">
                      <div className="flex justify-between text-xs text-slate-300 font-semibold">
                        <span>Last position: {lastReadBook.lastChapterTitle || 'Chapter 1'}</span>
                        <span className="text-rose-400">{Math.round(lastReadBook.progressPercent || 0)}% COMPLETED</span>
                      </div>
                      <div className="w-full h-2 bg-[#080C14] rounded-full overflow-hidden border border-[#232E45]">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                          style={{ width: `${Math.round(lastReadBook.progressPercent || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/read/${lastReadBook.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>CONTINUE READING</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REALISTIC WOODEN BOOKSHELF COMPONENT */}
            <Bookshelf unlockedBooks={unlockedBooks} lockedBooks={lockedBooks} />

          </div>
        )}

        {/* TAB 2: PURCHASE HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
              <History className="w-5 h-5 text-rose-400" />
              Digital Reading Access Purchase Log
            </h2>

            {purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#080C14] text-rose-300 font-serif border-b border-[#1E293E] uppercase">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2638]">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-black/20">
                        <td className="p-3 font-mono text-[11px] text-slate-400">{p.orderId}</td>
                        <td className="p-3 font-serif text-sm text-rose-100 font-semibold">{p.book.title}</td>
                        <td className="p-3 text-slate-400">{new Date(p.purchasedAt).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-rose-300">₹{p.amount}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED UNLOCKED
                          </span>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/read/${p.book.slug}`}
                            className="text-xs font-bold text-rose-400 hover:underline"
                          >
                            Read Online →
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

        {/* TAB 3: ACCOUNT */}
        {activeTab === 'account' && (
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-xl">
            <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-rose-400" />
              Account Details
            </h2>

            <div className="space-y-4 bg-[#080C14] p-5 rounded-2xl border border-[#1A2336] text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Full Name</span>
                <span className="font-bold text-rose-200 text-sm">{user.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Email Address</span>
                <span className="font-bold text-rose-200 text-sm">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[10px]">Account Role</span>
                <span className="font-bold text-rose-400 uppercase">{user.role}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>LOG OUT OF ACCOUNT</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
