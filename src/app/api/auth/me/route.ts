import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ user: null, purchasedBookIds: [] });
    }

    const purchases = await db.purchase.findMany({
      where: {
        userId: user.id,
        status: 'SUCCESS',
      },
      select: {
        bookId: true,
      },
    });

    const purchasedBookIds = purchases.map((p) => p.bookId);

    return NextResponse.json({
      user,
      purchasedBookIds,
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ user: null, purchasedBookIds: [] });
  }
}
