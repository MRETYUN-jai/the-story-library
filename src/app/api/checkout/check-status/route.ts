import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const purchase = await db.purchase.findFirst({
      where: {
        orderId,
        userId: user.id,
      },
      select: {
        id: true,
        status: true,
        utrNumber: true,
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: purchase.status,
      isUnlocked: purchase.status === 'SUCCESS',
      isPending: purchase.status === 'PENDING_APPROVAL',
      isRejected: purchase.status === 'REJECTED',
      book: purchase.book,
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
