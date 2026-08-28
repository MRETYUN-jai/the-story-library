import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required. Please log in to purchase.' }, { status: 401 });
    }

    const { bookId, couponCode } = await request.json();

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    const book = await db.book.findUnique({
      where: { id: bookId },
    });

    if (!book || !book.digitalEnabled) {
      return NextResponse.json({ error: 'Book is not available for digital purchase' }, { status: 404 });
    }

    // Check if user already owns this book
    const existingPurchase = await db.purchase.findFirst({
      where: {
        userId: user.id,
        bookId: book.id,
        status: 'SUCCESS',
      },
    });

    if (existingPurchase) {
      return NextResponse.json({ error: 'You already own digital access to this book!', isUnlocked: true }, { status: 400 });
    }

    // Calculate Discount if Coupon Code provided
    let finalPrice = book.digitalPrice;
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });

      if (
        coupon &&
        coupon.active &&
        (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses) &&
        (!coupon.expiryDate || new Date() <= coupon.expiryDate) &&
        (!coupon.bookId || coupon.bookId === book.id)
      ) {
        validCoupon = coupon;
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (book.digitalPrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(book.digitalPrice, Math.max(0, discountAmount));
        finalPrice = Math.max(0, book.digitalPrice - discountAmount);
      }
    }

    const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
    const amountInPaise = Math.round(finalPrice * 100);

    // Save pending purchase
    await db.purchase.create({
      data: {
        userId: user.id,
        bookId: book.id,
        couponId: validCoupon?.id || null,
        orderId,
        amount: finalPrice,
        discountAmount,
        currency: book.currency,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: book.currency,
      book: {
        id: book.id,
        title: book.title,
        originalPrice: book.digitalPrice,
        finalPrice,
        discountAmount,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create checkout order' }, { status: 500 });
  }
}
