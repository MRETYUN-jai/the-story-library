import Link from 'next/link';
import { Heart, Feather, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#05070D] border-t border-[#192133] text-slate-400 text-sm py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand & Author Bio */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
              <Feather className="w-4 h-4 text-rose-400" />
            </div>
            <span className="font-serif text-xl text-rose-200 tracking-wider font-semibold">
              THE STORY LIBRARY
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md font-serif italic">
            &ldquo;Stories of unsaid feelings, choices, memories, and one-sided love by author <span className="text-rose-300 font-medium not-italic">Mretyun Jai B</span>.&rdquo;
          </p>
          <div className="flex items-center gap-2 text-xs text-rose-300/90 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20 max-w-max">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Secure In-Browser Digital Reading Access • Copyright Protected</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-rose-200 text-sm tracking-wider uppercase mb-4 font-bold">Navigation</h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li>
              <Link href="/" className="hover:text-rose-300 transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/books" className="hover:text-rose-300 transition-colors">Explore All Books</Link>
            </li>
            <li>
              <Link href="/trilogy" className="hover:text-rose-300 transition-colors">Can Love Survive? Trilogy</Link>
            </li>
            <li>
              <Link href="/library" className="hover:text-rose-300 transition-colors">My Library</Link>
            </li>
          </ul>
        </div>

        {/* Formats & Info */}
        <div>
          <h4 className="font-serif text-rose-200 text-sm tracking-wider uppercase mb-4 font-bold">Reading Formats</h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="text-rose-300/90 font-medium">✓ Instant Online Digital Access</li>
            <li className="flex items-center gap-1 hover:text-rose-300 transition-colors">
              <span>Paperback Editions (Pothi.com)</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </li>
            <li className="flex items-center gap-1 hover:text-rose-300 transition-colors">
              <span>Hardcover Editions (Pothi.com)</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-[#141B2B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Mretyun Jai B. All rights reserved. The Story Library.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for every overthinker.
        </p>
      </div>
    </footer>
  );
}
