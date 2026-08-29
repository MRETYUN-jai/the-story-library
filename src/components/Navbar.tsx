'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Feather,
  BookOpen,
  Compass,
  Heart,
  User as UserIcon,
  Shield,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="bg-[#080C14]/90 backdrop-blur-md border-b border-[#1E293E] sticky top-0 z-40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRANDING LOGO & TAGLINE - LOCKED SINGLE LINE */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-500/10 group-hover:scale-105 transition-transform">
            <Feather className="w-5 h-5 text-rose-400" />
          </div>

          <div className="flex flex-col justify-center">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-rose-100 whitespace-nowrap">
              THE STORY LIBRARY
            </span>
            <span className="text-[9px] uppercase tracking-widest text-rose-300/70 font-sans whitespace-nowrap hidden sm:block font-medium">
              STORIES OF UNSAID FEELINGS • MRETYUN JAI B
            </span>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <Link
            href="/"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === '/' ? 'text-rose-400 font-bold' : 'text-slate-300 hover:text-rose-300'
            }`}
          >
            <span>HOME</span>
          </Link>

          <Link
            href="/books"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === '/books' ? 'text-rose-400 font-bold' : 'text-slate-300 hover:text-rose-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>EXPLORE STORIES</span>
          </Link>

          <Link
            href="/trilogy"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === '/trilogy' ? 'text-rose-400 font-bold' : 'text-slate-300 hover:text-rose-300'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>THE TRILOGY</span>
          </Link>

          <Link
            href="/library"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === '/library' ? 'text-rose-400 font-bold' : 'text-slate-300 hover:text-rose-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>MY LIBRARY</span>
          </Link>

          {/* ADMIN LINK IF ADMIN USER */}
          {user && user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="py-1.5 px-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-bold text-[11px] flex items-center gap-1.5 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>AUTHOR ADMIN</span>
            </Link>
          )}
        </nav>

        {/* RIGHT USER / AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/library"
                className="py-2 px-3.5 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
                  <UserIcon className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span>{user.name.split(' ')[0]}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="py-2 px-4 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/40 text-rose-200 text-xs font-bold transition-all"
              >
                SIGN IN
              </Link>

              <Link
                href="/auth/signup"
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}