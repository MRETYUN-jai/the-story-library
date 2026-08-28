'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Lock, CheckCircle, GitFork, Heart } from 'lucide-react';

interface TrilogyTreeProps {
  purchasedBookIds?: string[];
  book1: any;
  book2: any;
  book3: any;
}

export default function TrilogyTree({ purchasedBookIds = [], book1, book2, book3 }: TrilogyTreeProps) {
  const isBook1Unlocked = book1 && purchasedBookIds.includes(book1.id);
  const isBook2Unlocked = book2 && purchasedBookIds.includes(book2.id);
  const isBook3Unlocked = book3 && purchasedBookIds.includes(book3.id);
  const bothEndingsUnlocked = isBook2Unlocked && isBook3Unlocked;

  return (
    <div className="bg-[#0A0E1A] border border-[#1E293E] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden my-10 font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          Interactive Emotional Trilogy
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl text-rose-100 font-bold tracking-tight">
          THE CAN LOVE SURVIVE? TRILOGY
        </h2>
        <p className="text-xs sm:text-sm text-rose-200/90 font-serif italic">
          &ldquo;ONE QUESTION. TWO CHOICES. TWO ENDINGS.&rdquo;
        </p>

        {/* Both Endings Unlocked Badge */}
        {bothEndingsUnlocked && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 via-rose-400/30 to-rose-500/20 border border-rose-400 text-rose-200 font-serif font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/20 animate-pulse">
            <CheckCircle className="w-4 h-4 text-rose-400" />
            <span>YOU HAVE UNLOCKED BOTH ENDINGS</span>
          </div>
        )}
      </div>

      {/* Visual Decision Tree */}
      <div className="relative z-10 space-y-10">
        
        {/* ROOT NODE: BOOK I */}
        <div className="max-w-md mx-auto">
          <div className="bg-[#101726] border-2 border-rose-500/40 rounded-2xl p-5 shadow-xl hover:border-rose-400 transition-all text-center space-y-3">
            <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              BOOK I • THE BEGINNING
            </span>
            <h3 className="font-serif text-xl font-bold text-rose-100">{book1?.title || 'CAN LOVE SURVIVE?'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-serif italic">
              Two souls meet in a quiet library during midnight rain. When distance tests their unspoken bond, a central question remains...
            </p>
            <div className="pt-2">
              <Link
                href={`/books/${book1?.slug || 'can-love-survive'}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow"
              >
                <span>{isBook1Unlocked ? 'READ BOOK I' : 'BUY & UNLOCK BOOK I'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* CHOICE CONNECTOR NODE */}
        <div className="flex flex-col items-center justify-center space-y-2">
          {/* Vertical Connecting Line */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-rose-500/60 to-rose-400/20" />
          
          <div className="px-4 py-2 rounded-full bg-[#141C2E] border border-rose-500/30 text-rose-200 text-xs font-serif font-semibold shadow-md flex items-center gap-2">
            <GitFork className="w-4 h-4 text-rose-400" />
            <span>THE CROSSROADS: WHAT WOULD YOU CHOOSE?</span>
          </div>

          {/* Branch Lines */}
          <div className="w-full max-w-2xl h-6 border-t-2 border-x-2 border-rose-500/30 rounded-t-xl mt-2 hidden sm:block" />
        </div>

        {/* BRANCH ENDINGS: BOOK II & BOOK III */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          
          {/* PATH A: BOOK II */}
          <div className="bg-[#101726] border border-[#1E293E] hover:border-rose-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  BOOK II • PATH A
                </span>
                {isBook2Unlocked ? (
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> UNLOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold text-rose-100">{book2?.title || 'NOT LIKE THIS'}</h3>
              <p className="text-xs text-rose-300/80 font-medium">Branch A • Choosing Pride, Silence & Letting Go</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                What happens when holding on hurts more than walking away? A raw exploration of unsaid words, grief, and the bitter courage to say goodbye.
              </p>
            </div>

            <div className="pt-4 border-t border-[#1C2638] flex items-center justify-between">
              <span className="font-serif text-base font-bold text-rose-300">₹{book2?.digitalPrice || 249}</span>
              <Link
                href={`/books/${book2?.slug || 'not-like-this'}`}
                className="py-2 px-3.5 rounded-lg bg-[#182338] border border-[#2B3A57] hover:border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span>{isBook2Unlocked ? 'READ PATH A' : 'EXPLORE PATH A'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* PATH B: BOOK III */}
          <div className="bg-[#101726] border border-[#1E293E] hover:border-rose-500/50 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  BOOK III • PATH B
                </span>
                {isBook3Unlocked ? (
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> UNLOCKED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-bold text-rose-100">{book3?.title || 'ONLY IF IT WAITS'}</h3>
              <p className="text-xs text-rose-300/80 font-medium">Branch B • Choosing Patience, Forgiveness & Time</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                What if time was never the enemy, but the test? Exploring quiet endurance, mature forgiveness, and discovering if two people can heal years later.
              </p>
            </div>

            <div className="pt-4 border-t border-[#1C2638] flex items-center justify-between">
              <span className="font-serif text-base font-bold text-rose-300">₹{book3?.digitalPrice || 249}</span>
              <Link
                href={`/books/${book3?.slug || 'only-if-it-waits'}`}
                className="py-2 px-3.5 rounded-lg bg-[#182338] border border-[#2B3A57] hover:border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span>{isBook3Unlocked ? 'READ PATH B' : 'EXPLORE PATH B'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
