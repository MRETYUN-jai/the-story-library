import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const totalUsers = await db.user.count();
    const totalBooks = await db.book.count();

    const purchases = await db.purchase.findMany({
      where: { status: 'SUCCESS' },
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, coverImage: true } },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

    const activeReaders = await db.readingProgress.count();

    // Group purchases by book
    const bookSalesMap: Record<string, { title: string; count: number; revenue: number }> = {};
    for (const p of purchases) {
      if (!bookSalesMap[p.bookId]) {
        bookSalesMap[p.bookId] = {
          title: p.book.title,
          count: 0,
          revenue: 0,
        };
      }
      bookSalesMap[p.bookId].count += 1;
      bookSalesMap[p.bookId].revenue += p.amount;
    }

    const topBooks = Object.values(bookSalesMap).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalBooks,
        totalPurchases: purchases.length,
        totalRevenue,
        activeReaders,
      },
      recentPurchases: purchases.slice(0, 10),
      topBooks,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
