import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import BookDetailPageClient from './BookDetailPageClient';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await db.book.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      genre: true,
      coverImage: true,
      digitalPrice: true,
      currency: true,
      digitalEnabled: true,
      paperbackEnabled: true,
      paperbackPublisher: true,
      paperbackLink: true,
      hardcoverEnabled: true,
      hardcoverPublisher: true,
      hardcoverLink: true,
      kindleEnabled: true,
      kindlePublisher: true,
      kindleLink: true,
      bookNumber: true,
      seriesId: true,
      series: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      chapters: {
        where: { published: true },
        select: { id: true, chapterNumber: true, title: true },
        orderBy: { chapterNumber: 'asc' },
      },
    },
  });

  if (!book) {
    notFound();
  }

  // Server-side check for purchase and pending approval status to eliminate client UI flicker
  const user = await getSessionUser();
  let isPurchased = false;
  let isPending = false;
  let pendingOrderInfo = null;
  let isRejected = false;
  let rejectedOrderInfo = null;

  if (user) {
    if (user.role === 'ADMIN') {
      isPurchased = true;
    } else {
      const purchase = await db.purchase.findFirst({
        where: {
          userId: user.id,
          bookId: book.id,
          status: { in: ['SUCCESS', 'COMPLETED'] },
        },
      });

      if (purchase) {
        isPurchased = true;
      } else {
        const pending = await db.purchase.findFirst({
          where: {
            userId: user.id,
            bookId: book.id,
            status: 'PENDING_APPROVAL',
            utrNumber: { not: null },
          },
          orderBy: { purchasedAt: 'desc' },
        });

        if (pending) {
          isPending = true;
          pendingOrderInfo = {
            orderId: pending.orderId,
            utrNumber: pending.utrNumber,
            amount: pending.amount,
            purchasedAt: pending.purchasedAt ? pending.purchasedAt.toISOString() : new Date().toISOString(),
          };
        } else {
          const rejected = await db.purchase.findFirst({
            where: {
              userId: user.id,
              bookId: book.id,
              status: 'REJECTED',
            },
            orderBy: { purchasedAt: 'desc' },
          });

          if (rejected) {
            isRejected = true;
            rejectedOrderInfo = {
              orderId: rejected.orderId,
              utrNumber: rejected.utrNumber,
              amount: rejected.amount,
              purchasedAt: rejected.purchasedAt ? rejected.purchasedAt.toISOString() : new Date().toISOString(),
            };
          }
        }
      }
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent flex items-center justify-center text-xs text-rose-300 font-serif">
        Loading story details...
      </div>
    }>
      <BookDetailPageClient
        book={book}
        isPurchased={isPurchased}
        initialPending={isPending}
        initialPendingOrder={pendingOrderInfo}
        initialRejected={isRejected}
        initialRejectedOrder={rejectedOrderInfo}
        initialUser={user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null}
      />
    </Suspense>
  );
}

