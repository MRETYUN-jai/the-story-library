import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import TrilogyTree from '@/components/TrilogyTree';
import { Heart, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrilogyPage() {
  const user = await getSessionUser();

  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      genre: true,
      coverImage: true,
      digitalPrice: true,
      digitalEnabled: true,
      currency: true,
      paperbackEnabled: true,
      paperbackLink: true,
      hardcoverEnabled: true,
      hardcoverLink: true,
      kindleEnabled: true,
      kindleLink: true,
      seriesId: true,
      bookNumber: true,
      series: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { seriesId: 'asc' },
      { bookNumber: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const book1 = books.find((b) => b.slug === 'can-love-survive');
  const book2 = books.find((b) => b.slug === 'not-like-this');
  const book3 = books.find((b) => b.slug === 'only-if-it-waits');

  let purchasedBookIds: string[] = [];
  if (user) {
    const purchases = await db.purchase.findMany({
      where: { userId: user.id, status: 'SUCCESS' },
      select: { bookId: true },
    });
    purchasedBookIds = purchases.map((p) => p.bookId);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Page Banner */}
        <div className="bg-[#0E1422]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-widest relative z-10">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>INTERACTIVE BRANCHING STORIES</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-rose-100">
            THE TRILOGY ARCHIVE
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-serif italic">
            &ldquo;One crucial crossroads leads into two parallel paths. Choose between the bitter reality of pride or the patient endurance of time.&rdquo;
          </p>
        </div>

        <TrilogyTree
          book1={book1}
          book2={book2}
          book3={book3}
        />
      </div>
    </div>
  );
}
