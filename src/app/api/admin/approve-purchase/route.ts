import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { sendReaderPaymentApprovedEmail, sendReaderPaymentRejectedEmail } from '@/lib/email';

/**
 * GET: 1-Tap Mobile Approval directly from Author's Gmail email.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const action = searchParams.get('action') || 'approve';

    if (!token) {
      return new NextResponse(renderHtmlMessage({
        success: false,
        title: 'Invalid Link',
        message: 'Security approval token is missing or expired.',
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    const purchase = await db.purchase.findFirst({
      where: { approvalToken: token },
      include: {
        book: true,
        user: true,
      },
    });

    if (!purchase) {
      return new NextResponse(renderHtmlMessage({
        success: false,
        title: 'Purchase Not Found',
        message: 'This approval link has already been processed or is invalid.',
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    if (purchase.status === 'SUCCESS') {
      return new NextResponse(renderHtmlMessage({
        success: true,
        title: 'Already Approved',
        message: `"${purchase.book.title}" was already unlocked for ${purchase.user.name} (${purchase.user.email}).`,
        readerEmail: purchase.user.email,
        bookTitle: purchase.book.title,
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    if (action === 'reject') {
      await db.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'REJECTED',
          approvalToken: null,
        },
      });

      // Send rejection notification email to user
      await sendReaderPaymentRejectedEmail({
        to: purchase.user.email,
        userName: purchase.user.name,
        bookTitle: purchase.book.title,
        reason: 'Payment could not be verified against the author bank account statement.',
      }).catch(() => {});

      return new NextResponse(renderHtmlMessage({
        success: false,
        title: 'Payment Rejected',
        message: `Payment request for "${purchase.book.title}" by ${purchase.user.name} was rejected. Access was not granted and an update email was dispatched.`,
      }), { headers: { 'Content-Type': 'text/html' } });
    }

    // APPROVE PURCHASE
    await db.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'SUCCESS',
        paymentId: `upi_${purchase.utrNumber || 'verified'}`,
        approvalToken: null,
        purchasedAt: new Date(),
      },
    });

    // Create initial reading progress
    const firstChapter = await db.chapter.findFirst({
      where: { bookId: purchase.bookId, published: true },
      orderBy: { chapterNumber: 'asc' },
    });

    if (firstChapter) {
      await db.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId: purchase.userId,
            bookId: purchase.bookId,
          },
        },
        update: {},
        create: {
          userId: purchase.userId,
          bookId: purchase.bookId,
          chapterId: firstChapter.id,
          positionPercent: 0,
        },
      });
    }

    // Increment coupon count if used
    if (purchase.couponId) {
      await db.coupon.update({
        where: { id: purchase.couponId },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Send unlock email notification to reader
    await sendReaderPaymentApprovedEmail({
      to: purchase.user.email,
      userName: purchase.user.name,
      bookTitle: purchase.book.title,
      bookSlug: purchase.book.slug,
    });

    return new NextResponse(renderHtmlMessage({
      success: true,
      title: 'Payment Verified & Book Unlocked!',
      message: `Full reading access to "${purchase.book.title}" has been granted to ${purchase.user.name} (${purchase.user.email}). An automated confirmation email was dispatched to the reader.`,
      readerEmail: purchase.user.email,
      bookTitle: purchase.book.title,
      amount: purchase.amount,
      utr: purchase.utrNumber || undefined,
    }), { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    console.error('Approve purchase GET error:', error);
    return new NextResponse(renderHtmlMessage({
      success: false,
      title: 'Server Error',
      message: error.message || 'An unexpected error occurred while processing.',
    }), { headers: { 'Content-Type': 'text/html' } });
  }
}

/**
 * POST: For Admin Dashboard approvals.
 */
export async function POST(request: Request) {
  try {
    const adminUser = await getSessionUser();
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { purchaseId, action } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Purchase ID is required.' }, { status: 400 });
    }

    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId },
      include: { book: true, user: true },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found.' }, { status: 404 });
    }

    if (action === 'reject') {
      await db.purchase.update({
        where: { id: purchase.id },
        data: { status: 'REJECTED', approvalToken: null },
      });

      // Send rejection notification email to user
      await sendReaderPaymentRejectedEmail({
        to: purchase.user.email,
        userName: purchase.user.name,
        bookTitle: purchase.book.title,
        reason: 'Payment could not be verified by the admin against the bank account statement.',
      }).catch(() => {});

      return NextResponse.json({ success: true, message: 'Payment rejected and update email sent to user.' });
    }

    // Approve
    await db.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'SUCCESS',
        paymentId: `upi_${purchase.utrNumber || 'verified'}`,
        approvalToken: null,
        purchasedAt: new Date(),
      },
    });

    // Create initial reading progress
    const firstChapter = await db.chapter.findFirst({
      where: { bookId: purchase.bookId, published: true },
      orderBy: { chapterNumber: 'asc' },
    });

    if (firstChapter) {
      await db.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId: purchase.userId,
            bookId: purchase.bookId,
          },
        },
        update: {},
        create: {
          userId: purchase.userId,
          bookId: purchase.bookId,
          chapterId: firstChapter.id,
          positionPercent: 0,
        },
      });
    }

    // Increment coupon count if used
    if (purchase.couponId) {
      await db.coupon.update({
        where: { id: purchase.couponId },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Send celebratory unlock email
    await sendReaderPaymentApprovedEmail({
      to: purchase.user.email,
      userName: purchase.user.name,
      bookTitle: purchase.book.title,
      bookSlug: purchase.book.slug,
    });

    return NextResponse.json({
      success: true,
      message: `Payment approved! "${purchase.book.title}" is now unlocked for ${purchase.user.name}.`,
    });
  } catch (error: any) {
    console.error('Approve purchase POST error:', error);
    return NextResponse.json({ error: 'Failed to process payment approval.' }, { status: 500 });
  }
}

function renderHtmlMessage({
  success,
  title,
  message,
  readerEmail,
  bookTitle,
  amount,
  utr,
}: {
  success: boolean;
  title: string;
  message: string;
  readerEmail?: string;
  bookTitle?: string;
  amount?: number;
  utr?: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - StoryVault Control</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #080C14;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .card {
            background-color: #0E1422;
            border: 1px solid ${success ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'};
            border-radius: 28px;
            max-width: 480px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
          }
          .icon {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            background-color: ${success ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'};
            border: 2px solid ${success ? '#10B981' : '#F43F5E'};
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 32px;
          }
          h1 {
            font-size: 22px;
            font-weight: bold;
            color: #FFF1F2;
            margin-bottom: 12px;
            font-family: Georgia, serif;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 24px;
          }
          .details {
            background-color: #080C14;
            border: 1px solid #1E293E;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
            font-size: 13px;
          }
          .details div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .details div:last-child { margin-bottom: 0; }
          .details span { color: #64748b; }
          .details strong { color: #f1f5f9; }
          .btn {
            display: inline-block;
            background: linear-gradient(90deg, #E11D48, #BE123C);
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
            padding: 14px 24px;
            border-radius: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${success ? '✔' : '✖'}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          ${readerEmail && bookTitle ? `
            <div class="details">
              <div><span>Book:</span> <strong>${bookTitle}</strong></div>
              <div><span>Reader:</span> <strong>${readerEmail}</strong></div>
              ${amount ? `<div><span>Amount:</span> <strong style="color:#10B981;">₹${amount}</strong></div>` : ''}
              ${utr ? `<div><span>UTR:</span> <strong style="font-family:monospace;color:#FDA4AF;">${utr}</strong></div>` : ''}
            </div>
          ` : ''}
          <a href="/admin" class="btn">Open Admin Dashboard</a>
        </div>
      </body>
    </html>
  `;
}
