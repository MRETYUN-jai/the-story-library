'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AmbientSoundPlayer from '@/components/AmbientSoundPlayer';
import {
  Feather,
  BookOpen,
  Compass,
  Heart,
  User as UserIcon,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{
    name: string;
    nickname?: string | null;
    avatar?: string | null;
    email: string;
    role: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { label: 'HOME', href: '/' },
    { label: 'STORIES', href: '/books', icon: Compass },
    { label: 'TRILOGY', href: '/trilogy', icon: Heart },
    { label: 'MY LIBRARY', href: '/library', icon: BookOpen },
  ];

  return (
    <header className="bg-[#080C14]/35 backdrop-blur-2xl border-b border-white/[0.12] sticky top-0 z-40 font-sans transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* BRANDING LOGO & TITLE */}
        <Link 
          href="/" 
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-500/10 group-hover:scale-105 group-hover:border-rose-500/60 group-hover:bg-rose-500/25 transition-all duration-300">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 group-hover:text-rose-300" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-base sm:text-lg font-bold tracking-wider text-rose-100 whitespace-nowrap">
                STORYVAULT
              </span>
            </div>
            <span className="text-xs uppercase tracking-widest text-rose-300/70 font-sans whitespace-nowrap hidden md:block font-medium">
              STORIES OF UNSAID FEELINGS • MRETYUN JAI B
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#0D1424]/30 backdrop-blur-2xl border border-white/[0.12] p-1.5 rounded-2xl shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={(e) => {
                  if (pathname === link.href) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-md shadow-rose-500/25'
                    : 'text-slate-300 hover:text-rose-200 hover:bg-rose-500/15'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 opacity-85" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* ADMIN BADGE */}
          {user && user.role === 'ADMIN' && (
            <Link
              href="/admin"
              prefetch={true}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                pathname === '/admin'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>ADMIN</span>
            </Link>
          )}
        </nav>

        {/* RIGHT CONTROLS: AMBIENT SOUND + AUTH */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Rain Soundscape Player */}
          <AmbientSoundPlayer />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                prefetch={true}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-md whitespace-nowrap ${
                  pathname === '/profile'
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-100 shadow-rose-500/20'
                    : 'bg-[#0E1422]/35 backdrop-blur-2xl border-white/[0.12] hover:border-rose-500/50 text-rose-200 hover:bg-rose-500/15'
                }`}
                title="View & Edit Reader Profile"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-rose-500 to-amber-500 p-[1.5px] shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/scholar.svg';
                      }}
                      className="w-full h-full object-cover rounded-full bg-[#0A0E1A]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#0A0E1A] flex items-center justify-center text-rose-300">
                      <UserIcon className="w-3 h-3 text-rose-400" />
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline">
                  {user.nickname ? user.nickname : user.name.split(' ')[0]}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                aria-label="Log Out"
                className="p-2 rounded-xl bg-[#0E1422]/35 backdrop-blur-2xl border border-white/[0.12] hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="py-1.5 px-3 rounded-xl bg-[#0E1422]/35 backdrop-blur-2xl border border-white/[0.12] hover:border-rose-500/50 text-rose-200 text-xs font-bold transition-all whitespace-nowrap hidden sm:inline-block"
              >
                SIGN IN
              </Link>

              <Link
                href="/auth/signup"
                className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all whitespace-nowrap"
              >
                REGISTER
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl bg-[#0E1422]/35 backdrop-blur-2xl border border-white/[0.12] text-slate-300 hover:text-rose-300 transition-all"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0A0E18]/90 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in shadow-2xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-300 hover:bg-[#131B2C] hover:text-rose-300'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          {user && (
            <Link
              href="/profile"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === '/profile'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-[#131B2C] hover:text-rose-300'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                <img
                  src={user.avatar || '/avatars/scholar.svg'}
                  alt={user.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/scholar.svg';
                  }}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span>MY PROFILE ({user.nickname || user.name.split(' ')[0]})</span>
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300"
            >
              <Shield className="w-4 h-4 text-rose-400" />
              <span>ADMIN PANEL</span>
            </Link>
          )}

          {!user && (
            <div className="pt-2 border-t border-[#1A2336] flex gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded-xl bg-[#0E1422] border border-[#1E293E] text-xs font-bold text-rose-200"
              >
                SIGN IN
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}