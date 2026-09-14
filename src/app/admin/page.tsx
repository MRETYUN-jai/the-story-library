import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login?redirect=/admin');
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

  const books = await db.book.findMany({
    include: {
      series: true,
      chapters: {
        select: { id: true, chapterNumber: true, title: true, published: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const seriesList = await db.series.findMany();

  const readersList = await db.user.findMany({
    select: {
      id: true,
      name: true,
      nickname: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          purchases: { where: { status: 'SUCCESS' } },
          readingProgress: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pendingPurchases = await db.purchase.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      book: { select: { id: true, title: true, coverImage: true, digitalPrice: true } },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        totalBooks,
        totalPurchases: purchases.length,
        totalRevenue,
        activeReaders,
      }}
      recentPurchases={purchases.slice(0, 10)}
      pendingPurchases={pendingPurchases}
      books={books}
      seriesList={seriesList}
      readersList={readersList}
    />
  );
}
