import Link from 'next/link';
import { db } from '@/lib/db';
import TrilogyTree from '@/components/TrilogyTree';
import { Feather, BookOpen, Compass, ArrowRight, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default async function HomePage() {
  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    include: { series: true },
    orderBy: { createdAt: 'desc' },
  });

  const book1 = books.find((b) => b.slug === 'can-love-survive');
  const book2 = books.find((b) => b.slug === 'not-like-this');
  const book3 = books.find((b) => b.slug === 'only-if-it-waits');

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 font-sans selection:bg-rose-500/30">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#1A2234]">
        
        {/* Midnight Emotional Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-500/15 via-rose-900/10 to-transparent blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-widest animate-pulse">
            <Feather className="w-4 h-4 text-rose-400" />
            FOR EVERY OVERTHINKER • UNSAID WORDS & ONE-SIDED LOVE
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-rose-100 leading-tight">
            THE STORY LIBRARY
          </h1>

          <p className="font-serif text-lg sm:text-2xl text-rose-200/90 italic max-w-3xl mx-auto font-light leading-relaxed">
            &ldquo;Stories of love, choices, memories, and everything left unsaid.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            Welcome to the official digital sanctuary of author <strong className="text-rose-300">Mretyun Jai B</strong>. 
            A quiet space dedicated to emotional romance, unrequited feelings, and late-night reflection. Read books online anytime inside our secure digital reader.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/books"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORE ALL STORIES</span>
            </Link>

            <Link
              href="/library"
              className="px-8 py-3.5 rounded-xl bg-[#131B2C] border border-[#26334D] hover:border-rose-500/50 text-rose-300 font-bold text-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span>MY DIGITAL LIBRARY</span>
            </Link>
          </div>

          {/* Trust Feature Bar */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Instant Online Reading Access
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              Unsaid Words & Branching Paths
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Physical Editions on Pothi.com
            </span>
          </div>

        </div>
      </section>

      {/* FEATURED TRILOGY EXPERIENCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <TrilogyTree book1={book1} book2={book2} book3={book3} />
      </section>

      {/* ALL AVAILABLE BOOKS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-rose-100 font-bold tracking-tight">
              AVAILABLE STORIES
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse all standalone stories and emotional series by Mretyun Jai B
            </p>
          </div>

          <Link
            href="/books"
            className="text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>VIEW ALL ({books.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/60 rounded-2xl p-5 shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4 bg-[#05080E]">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#080C14]/85 backdrop-blur-md text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {book.genre}
                  </div>
                </div>

                <div className="space-y-2">
                  {book.series && (
                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest block">
                      {book.series.name} {book.bookNumber ? `• Book ${book.bookNumber}` : ''}
                    </span>
                  )}
                  <h3 className="font-serif text-xl font-bold text-rose-100 group-hover:text-rose-300 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-[#1C2638] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Digital Reading</span>
                  <span className="font-serif text-lg font-bold text-rose-300">
                    ₹{book.digitalPrice}
                  </span>
                </div>

                <Link
                  href={`/books/${book.slug}`}
                  className="py-2.5 px-4 rounded-xl bg-[#161F31] border border-[#293752] hover:border-rose-500/50 text-rose-300 font-semibold text-xs transition-all flex items-center gap-1.5"
                >
                  <span>READ STORY</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AUTHOR SECTION */}
      <section className="bg-[#05070D] border-t border-[#192133] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-xl shadow-rose-500/10">
            <Feather className="w-8 h-8 text-rose-400" />
          </div>

          <h2 className="font-serif text-3xl font-bold text-rose-100">ABOUT THE AUTHOR</h2>
          <h3 className="text-lg font-serif text-rose-300/90 font-medium">Mretyun Jai B</h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed font-serif italic">
            &ldquo;Mretyun Jai B writes quiet, deeply personal stories about one-sided feelings, overthinking long after midnight, decisions that shape futures, and the unspoken emotions left behind. The Story Library is created as a permanent digital haven for every reader who has ever loved quietly.&rdquo;
          </p>

          <div className="pt-4">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest"
            >
              <span>Explore All Published Works</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
