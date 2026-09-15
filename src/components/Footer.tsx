'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Feather, ShieldCheck, ExternalLink, Sparkles, BookOpen } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative z-10 bg-[#05070D]/35 backdrop-blur-2xl border-t border-white/[0.1] text-slate-400 text-sm py-14 px-4 sm:px-6 lg:px-8 font-sans shadow-2xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        
        {/* Brand & Author Bio */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              onClick={handleNavClick('/')}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shadow-md group-hover:scale-105 transition-transform">
                <Feather className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <span className="font-serif text-lg text-rose-100 tracking-wider font-bold block group-hover:text-rose-300 transition-colors">
                  STORYVAULT
                </span>
                <span className="text-xs text-rose-400/80 uppercase font-mono tracking-widest">
                  DIGITAL SANCTUARY
                </span>
              </div>
            </Link>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-serif italic max-w-md">
            &ldquo;A quiet corner of the internet for everyone who overthinks at midnight, holds onto unspoken words, and remembers one-sided love.&rdquo;
          </p>

          <div className="inline-flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Anti-Screenshot Protected In-Browser Digital Reading</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="md:col-span-3 space-y-3">
          <h3 className="font-serif text-rose-200 text-xs tracking-widest uppercase font-bold">
            Navigation
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <Link 
                href="/" 
                onClick={handleNavClick('/')}
                className="hover:text-rose-300 transition-colors"
              >
                Home Sanctuary
              </Link>
            </li>
            <li>
              <Link 
                href="/books" 
                onClick={handleNavClick('/books')}
                className="hover:text-rose-300 transition-colors"
              >
                All Stories Catalog
              </Link>
            </li>
            <li>
              <Link 
                href="/trilogy" 
                onClick={handleNavClick('/trilogy')}
                className="hover:text-rose-300 transition-colors"
              >
                Can Love Survive? Trilogy Tree
              </Link>
            </li>
            <li>
              <Link 
                href="/library" 
                onClick={handleNavClick('/library')}
                className="hover:text-rose-300 transition-colors"
              >
                My Digital Library
              </Link>
            </li>
          </ul>
        </div>

        {/* Formats & Information */}
        <div className="md:col-span-4 space-y-3">
          <h3 className="font-serif text-rose-200 text-xs tracking-widest uppercase font-bold">
            Available Editions
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="text-rose-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Instant Digital Reading (StoryVault)</span>
            </li>
            <li>
              <a
                href="https://pothi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-rose-300 transition-colors"
              >
                <span>Paperback &amp; Hardcover Editions (Pothi.com)</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-[#131B2C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Mretyun Jai B. All rights reserved. StoryVault.</p>
        <p className="flex items-center gap-1 text-slate-400">
          Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for every quiet soul.
        </p>
      </div>
    </footer>
  );
}
