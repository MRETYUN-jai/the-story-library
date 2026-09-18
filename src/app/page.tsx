import Link from 'next/link';
import { Feather, BookOpen, Compass, ArrowRight, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import RandomQuoteTicker from '@/components/RandomQuoteTicker';

export default function HomePage() {
  return (
    <div className="bg-transparent text-slate-100 font-sans selection:bg-rose-500/30">
      
      {/* HERO SANCTUARY */}
      <section className="relative pt-24 pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#1A2234]/60 overflow-hidden">
        
        {/* Midnight Emotional Glow Halos */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-rose-500/15 via-rose-900/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute -top-24 left-1/4 w-72 h-72 bg-amber-500/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-widest animate-pulse">
            <Feather className="w-4 h-4 text-rose-400" />
            <span>FOR EVERY OVERTHINKER • UNSAID WORDS & MEMORIES</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-rose-100 leading-tight">
            STORYVAULT
          </h1>

          <p className="font-serif text-xl sm:text-2xl lg:text-3xl text-rose-200/90 italic max-w-3xl mx-auto font-light leading-relaxed">
            &ldquo;Stories of love, choices, memories, and everything left unsaid.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Welcome to the official digital sanctuary of author <strong className="text-rose-300">Mretyun Jai B</strong>. 
            A quiet space dedicated to emotional romance, unrequited feelings, and late-night reflection. Read books online anytime inside our secure digital canvas reader.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <Link
              href="/books"
              className="w-full sm:w-auto px-7 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE ALL STORIES</span>
            </Link>

            <Link
              href="/library"
              className="w-full sm:w-auto px-7 sm:px-8 py-3.5 rounded-2xl bg-[#131B2C]/35 backdrop-blur-2xl border border-white/[0.12] hover:border-rose-500/60 text-rose-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:bg-rose-500/15"
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span>MY DIGITAL LIBRARY</span>
            </Link>
          </div>

          {/* Trust Feature Bar */}
          <div className="pt-6 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 md:gap-6 text-[11px] sm:text-xs text-slate-300/90">
            <span className="flex items-center gap-1.5 sm:gap-2 bg-[#0E1422]/30 px-3.5 py-1.5 rounded-full border border-white/[0.08] backdrop-blur-xl">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span>Instant Canvas DRM Reading</span>
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2 bg-[#0E1422]/30 px-3.5 py-1.5 rounded-full border border-white/[0.08] backdrop-blur-xl">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span>Unsaid Words & Branching Paths</span>
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2 bg-[#0E1422]/30 px-3.5 py-1.5 rounded-full border border-white/[0.08] backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span>Direct UPI Transfer & Verified Unlocks</span>
            </span>
          </div>

        </div>
      </section>

      {/* LITERARY QUOTE SPOTLIGHT TICKER (RANDOMIZES ON REFRESH & CLICK) */}
      <RandomQuoteTicker />

      {/* AUTHOR SPOTLIGHT SECTION */}
      <section className="bg-gradient-to-b from-[#05070D]/20 to-[#080C14]/30 backdrop-blur-3xl border-t border-white/[0.08] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6 bg-[#0E1422]/35 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-white/[0.12] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.06] to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-2xl shadow-rose-500/20 animate-pulse">
            <Feather className="w-8 h-8 text-rose-400" />
          </div>

          <span className="text-xs uppercase tracking-widest text-rose-400 font-mono font-bold block">
            ABOUT THE AUTHOR
          </span>
          
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-rose-100">
            Mretyun Jai B
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-serif italic">
            &ldquo;Mretyun Jai B writes quiet, deeply personal stories about one-sided feelings, overthinking long after midnight, decisions that shape futures, and the unspoken emotions left behind. StoryVault is created as a permanent digital sanctuary for every reader who has ever loved quietly.&rdquo;
          </p>

          <div className="pt-4">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-300 bg-rose-500/15 backdrop-blur-xl border border-rose-500/30 px-6 py-3 rounded-2xl hover:bg-rose-500/25 transition-all shadow-lg"
            >
              <span>EXPLORE ALL PUBLISHED WORKS</span>
              <ArrowRight className="w-4 h-4 text-rose-400" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
