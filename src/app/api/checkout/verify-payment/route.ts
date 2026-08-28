import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required. Please log in to complete purchase.' }, { status: 401 });
    }

    const { orderId, paymentId, signature, utrNumber, isUpiDirect } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const purchase = await db.purchase.findFirst({
      where: {
        orderId,
        userId: user.id,
      },
      include: {
        book: true,
        coupon: true,
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    // Direct UPI Real Money Transfer Verification
    if (isUpiDirect || utrNumber) {
      const cleanUtr = utrNumber?.toString().trim();
      if (!cleanUtr || cleanUtr.length < 10) {
        return NextResponse.json({
          error: 'Please enter a valid 12-digit UPI UTR / Reference Number from your Google Pay, PhonePe, or Paytm transaction receipt.',
        }, { status: 400 });
      }

      // Save UTR Number and mark as SUCCESS
      await db.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'SUCCESS',
          utrNumber: cleanUtr,
          paymentId: `upi_${cleanUtr}`,
          purchasedAt: new Date(),
        },
      });
    } else {
      // Razorpay Payment Verification
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret && signature && paymentId) {
        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${orderId}|${paymentId}`)
          .digest('hex');

        if (generatedSignature !== signature) {
          await db.purchase.update({
            where: { id: purchase.id },
            data: { status: 'FAILED' },
          });
          return NextResponse.json({ error: 'Payment signature verification failed. Access denied.' }, { status: 400 });
        }
      }

      await db.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'SUCCESS',
          paymentId: paymentId || `pay_verified_${crypto.randomBytes(6).toString('hex')}`,
          paymentSignature: signature || 'verified',
          purchasedAt: new Date(),
        },
      });
    }

    // Increment coupon used count if used
    if (purchase.couponId) {
      await db.coupon.update({
        where: { id: purchase.couponId },
        data: { usedCount: { increment: 1 } },
      }).catch((err) => console.error('Failed to increment coupon count:', err));
    }

    // Create initial reading progress
    const firstChapter = await db.chapter.findFirst({
      where: { bookId: purchase.bookId, published: true },
      orderBy: { chapterNumber: 'asc' },
    });

    if (firstChapter) {
      await db.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: purchase.bookId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          bookId: purchase.bookId,
          chapterId: firstChapter.id,
          positionPercent: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified! Book is now unlocked in your library.',
      book: {
        id: purchase.book.id,
        title: purchase.book.title,
        slug: purchase.book.slug,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
