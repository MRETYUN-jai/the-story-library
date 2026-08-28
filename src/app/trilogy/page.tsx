import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import TrilogyTree from '@/components/TrilogyTree';

export default async function TrilogyPage() {
  const user = await getSessionUser();

  const books = await db.book.findMany({
    where: { status: 'PUBLISHED' },
    include: { series: true },
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
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <TrilogyTree
          purchasedBookIds={purchasedBookIds}
          book1={book1}
          book2={book2}
          book3={book3}
        />
      </div>
    </div>
  );
}
