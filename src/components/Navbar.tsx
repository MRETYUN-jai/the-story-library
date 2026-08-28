'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, User, LogOut, Shield, Compass, Heart, Feather } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  // Hide Navbar inside Reader full screen
  if (pathname.startsWith('/read/')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-[#080C14]/95 backdrop-blur-md border-b border-[#1E2638]/70 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo with Emotional Rose Gold Glow */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 p-0.5 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080C14] rounded-full flex items-center justify-center text-rose-300">
              <Feather className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl tracking-wider font-semibold bg-gradient-to-r from-rose-100 via-rose-200 to-rose-300 bg-clip-text text-transparent">
              THE STORY LIBRARY
            </span>
            <p className="text-[10px] text-rose-300/70 uppercase tracking-widest font-sans hidden sm:block font-medium">
              Stories of unsaid feelings • Mretyun Jai B
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium font-sans">
          <Link
            href="/"
            className={`transition-colors duration-200 ${
              pathname === '/' ? 'text-rose-300 font-semibold' : 'text-slate-300 hover:text-rose-200'
            }`}
          >
            HOME
          </Link>

          <Link
            href="/books"
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              pathname === '/books' ? 'text-rose-300 font-semibold' : 'text-slate-300 hover:text-rose-200'
            }`}
          >
            <Compass className="w-4 h-4 text-rose-400/80" />
            EXPLORE STORIES
          </Link>

          <Link
            href="/trilogy"
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              pathname === '/trilogy' ? 'text-rose-300 font-semibold' : 'text-slate-300 hover:text-rose-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-400" />
            THE TRILOGY
          </Link>

          <Link
            href="/library"
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              pathname === '/library' ? 'text-rose-300 font-semibold' : 'text-slate-300 hover:text-rose-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-rose-400/80" />
            MY LIBRARY
          </Link>
        </nav>

        {/* Auth / Account Controls */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-24 h-8 rounded-full bg-slate-800/50 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span>AUTHOR ADMIN</span>
                </Link>
              )}

              <div className="flex items-center gap-2 bg-[#121826] border border-[#232F47] px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors px-3 py-1.5"
              >
                LOG IN
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all"
              >
                SIGN UP
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
