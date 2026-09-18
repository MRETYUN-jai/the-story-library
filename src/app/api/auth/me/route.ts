import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null, purchasedBookIds: [], pendingBookIds: [], pendingPurchases: [] });
    }

    const [purchases, pendingPurchases, rejectedPurchases] = await Promise.all([
      db.purchase.findMany({
        where: {
          userId: user.id,
          status: 'SUCCESS',
        },
        select: {
          bookId: true,
        },
      }),
      db.purchase.findMany({
        where: {
          userId: user.id,
          status: 'PENDING_APPROVAL',
          utrNumber: { not: null },
        },
        select: {
          id: true,
          bookId: true,
          orderId: true,
          utrNumber: true,
          amount: true,
          status: true,
          purchasedAt: true,
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
      db.purchase.findMany({
        where: {
          userId: user.id,
          status: 'REJECTED',
        },
        select: {
          id: true,
          bookId: true,
          orderId: true,
          utrNumber: true,
          amount: true,
          status: true,
          purchasedAt: true,
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
    ]);

    const purchasedBookIds = purchases.map((p) => p.bookId);
    const pendingBookIds = pendingPurchases.map((p) => p.bookId);
    const rejectedBookIds = rejectedPurchases.map((p) => p.bookId);

    return NextResponse.json({
      user,
      purchasedBookIds,
      pendingBookIds,
      pendingPurchases,
      rejectedBookIds,
      rejectedPurchases,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ user: null, purchasedBookIds: [], pendingBookIds: [], pendingPurchases: [], rejectedBookIds: [], rejectedPurchases: [] });
  }
}
