import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendAuthorPaymentAlert } from '@/lib/email';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to complete purchase.' },
        { status: 401 }
      );
    }

    const { orderId, utrNumber, receiptImage } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const cleanUtr = utrNumber ? utrNumber.toString().trim().replace(/\s+/g, '') : '';

    if (!cleanUtr || cleanUtr.length < 10) {
      return NextResponse.json({
        error: 'Please enter a valid 12-digit UPI UTR / Reference number from your payment receipt.',
      }, { status: 400 });
    }

    // 1. Anti-Fraud Duplicate Check: Ensure UTR is not already used/approved
    const duplicateUtr = await db.purchase.findFirst({
      where: {
        utrNumber: cleanUtr,
        status: { in: ['SUCCESS', 'PENDING_APPROVAL'] },
        NOT: { orderId },
      },
    });

    if (duplicateUtr) {
      return NextResponse.json({
        error: 'This UPI Reference / UTR Number has already been submitted or approved. Please verify your receipt.',
      }, { status: 400 });
    }

    // 2. Fetch the pending order record
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

    if (purchase.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        isUnlocked: true,
        message: 'This book is already unlocked!',
      });
    }

    // 3. Save receipt screenshot image if provided
    let receiptUrl: string | undefined = undefined;

    if (receiptImage && typeof receiptImage === 'string' && receiptImage.startsWith('data:image/')) {
      try {
        const matches = receiptImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const fileName = `receipt_${purchase.id}_${Date.now()}.${extension}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, buffer);

          receiptUrl = `/uploads/receipts/${fileName}`;
        }
      } catch (err) {
        console.error('Failed to save receipt image:', err);
      }
    }

    // 4. Generate unique 1-tap approval cryptographic token
    const approvalToken = crypto.randomBytes(32).toString('hex');

    // 5. Update purchase to PENDING_APPROVAL
    await db.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'PENDING_APPROVAL',
        utrNumber: cleanUtr,
        paymentReceipt: receiptUrl || purchase.paymentReceipt,
        approvalToken,
        purchasedAt: new Date(),
      },
    });

    // 6. Dispatch immediate notification to the author's Gmail
    await sendAuthorPaymentAlert({
      readerName: user.name,
      readerEmail: user.email,
      bookTitle: purchase.book.title,
      amount: purchase.amount,
      utrNumber: cleanUtr,
      receiptUrl,
      approvalToken,
    });

    return NextResponse.json({
      success: true,
      status: 'PENDING_APPROVAL',
      message: 'Payment proof submitted! Author Mretyun Jai B has been notified to verify and unlock your book.',
    });
  } catch (error) {
    console.error('Submit payment proof error:', error);
    return NextResponse.json({ error: 'Failed to submit payment proof' }, { status: 500 });
  }
}
