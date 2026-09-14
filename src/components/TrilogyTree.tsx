'use client';

import { useState } from 'react';
import { GitFork, Heart, Sparkles, BookOpen, Quote, Compass } from 'lucide-react';

interface TrilogyTreeProps {
  book1?: any;
  book2?: any;
  book3?: any;
}

export default function TrilogyTree({ book1, book2, book3 }: TrilogyTreeProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'themes'>('overview');

  return (
    <div className="bg-[#0E1422]/35 backdrop-blur-3xl border border-white/[0.12] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden my-6 font-sans">
      
      {/* Background Atmospheric Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/15 backdrop-blur-xl text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>TRILOGY STORY ARCHIVE • COMPLETE NARRATIVE OVERVIEW</span>
        </div>
        
        <h2 className="font-serif text-3xl sm:text-5xl text-rose-100 font-bold tracking-tight">
          THE CAN LOVE SURVIVE? TRILOGY
        </h2>
        
        <p className="text-sm sm:text-base text-rose-200/90 font-serif italic max-w-xl mx-auto leading-relaxed">
          &ldquo;One crucial question. Two diverging choices. Two completely different realities.&rdquo;
        </p>
      </div>

      {/* Visual Branching Decision Tree (Pure Content Showcase - No Redirections or Buying Links) */}
      <div className="relative z-10 space-y-8">
        
        {/* ROOT NODE: BOOK I (THE BEGINNING) */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#121829]/40 backdrop-blur-3xl border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.06] to-transparent pointer-events-none" />
            
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-rose-300 uppercase bg-rose-500/15 backdrop-blur-xl px-4 py-1.5 rounded-full border border-rose-500/30 relative z-10">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>BOOK I • THE BEGINNING</span>
            </div>

            {book1?.coverImage && (
              <div className="w-28 sm:w-32 aspect-[2/3] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/[0.12] bg-[#05080E]/80 relative z-10">
                <img src={book1.coverImage} alt={book1.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-2 relative z-10">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100">
                {book1?.title || 'CAN LOVE SURVIVE?'}
              </h3>
              <p className="text-xs text-rose-300/80 font-mono uppercase tracking-wider">
                The Foundation • Meeting Under the Rain
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-lg mx-auto relative z-10">
              Two souls meet in a quiet library on a stormy midnight. What starts as quiet company over unexpressed thoughts blossoms into an emotional bond that neither expected. But when silence, distance, and unresolved pasts test their trust, they arrive at an unforgettable emotional crossroads where a single decision alters everything.
            </p>

            {/* In-Place Content Highlights */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 relative z-10">
              <span className="px-3 py-1 rounded-lg bg-[#0A0E1A]/40 backdrop-blur-xl border border-white/[0.08] text-rose-300">
                • 8 Chapters of Emotion
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0A0E1A]/40 backdrop-blur-xl border border-white/[0.08] text-slate-300">
                • Theme: Unsaid Feelings & Distance
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0A0E1A]/40 backdrop-blur-xl border border-white/[0.08] text-slate-300">
                • Setting: Midnight Library & Rain
              </span>
            </div>

          </div>
        </div>

        {/* DECISION CROSSROADS NODE */}
        <div className="flex flex-col items-center justify-center space-y-2">
          {/* Vertical Connecting Line */}
          <div className="w-0.5 h-10 bg-gradient-to-b from-rose-500 via-rose-400 to-rose-500/40 animate-pulse" />
          
          <div className="px-6 py-3 rounded-full bg-[#131B2D]/45 backdrop-blur-2xl border-2 border-rose-500/40 text-rose-200 text-xs sm:text-sm font-serif font-bold shadow-2xl flex items-center gap-2.5">
            <GitFork className="w-4 h-4 text-rose-400" />
            <span>THE CROSSROADS: WHAT WILL YOU CHOOSE?</span>
          </div>

          <p className="text-[11px] text-slate-400 font-serif italic text-center max-w-md pt-1">
            At the end of Book I, the narrative branches into two parallel, independent journeys.
          </p>

          {/* Branch Connecting Lines for Desktop */}
          <div className="w-full max-w-3xl h-8 border-t-2 border-x-2 border-rose-500/40 rounded-t-2xl mt-2 hidden sm:block" />
        </div>

        {/* BRANCH ENDINGS: BOOK II (PATH A) & BOOK III (PATH B) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          
          {/* PATH A: BOOK II */}
          <div className="bg-[#101728]/35 backdrop-blur-3xl border border-white/[0.12] hover:border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:bg-[#141D30]/45">
            <div className="space-y-4">
              
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/15 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-rose-500/30">
                <Compass className="w-3 h-3 text-rose-400" />
                <span>BOOK II • BRANCH PATH A</span>
              </div>

              {book2?.coverImage && (
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/[0.1] bg-[#05080E]/80">
                  <img src={book2.coverImage} alt={book2.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-rose-100">
                  {book2?.title || 'NOT LIKE THIS'}
                </h3>
                <p className="text-xs text-rose-300 font-semibold font-serif">
                  Path A • Choosing Pride, Silence & Letting Go
                </p>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                What happens when holding on hurts more than walking away? In this branch, silence becomes an impenetrable wall. Words are withheld out of self-defense, pride dictates the silence, and both characters experience the poignant courage required to let go of the one person they never wanted to lose.
              </p>
            </div>

            {/* Narrative Key Points */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                Narrative Elements:
              </span>
              <ul className="text-xs text-slate-300 space-y-1 font-sans">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>The painful reality of unsaid confessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Learning closure without an apology</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Walking away with quiet self-respect</span>
                </li>
              </ul>
            </div>
          </div>

          {/* PATH B: BOOK III */}
          <div className="bg-[#101728]/35 backdrop-blur-3xl border border-white/[0.12] hover:border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:bg-[#141D30]/45">
            <div className="space-y-4">
              
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-rose-400 uppercase bg-rose-500/15 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-rose-500/30">
                <Compass className="w-3 h-3 text-rose-400" />
                <span>BOOK III • BRANCH PATH B</span>
              </div>

              {book3?.coverImage && (
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/[0.1] bg-[#05080E]/80">
                  <img src={book3.coverImage} alt={book3.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-rose-100">
                  {book3?.title || 'ONLY IF IT WAITS'}
                </h3>
                <p className="text-xs text-rose-300 font-semibold font-serif">
                  Path B • Choosing Patience, Forgiveness & Time
                </p>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                What if time was never the enemy, but the ultimate test? In this parallel reality, the silence is broken. This path explores quiet endurance, emotional maturity, forgiving unspoken mistakes, and discovering whether two souls who parted under the rain can rediscover each other years later.
              </p>
            </div>

            {/* Narrative Key Points */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                Narrative Elements:
              </span>
              <ul className="text-xs text-slate-300 space-y-1 font-sans">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>The quiet power of giving time a second chance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>Healing without resentment</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>A peaceful reunion after years of growth</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
