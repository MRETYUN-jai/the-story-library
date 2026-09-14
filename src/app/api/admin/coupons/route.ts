import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const coupons = await db.coupon.findMany({
      include: {
        book: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Admin list coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { code, discountType, discountValue, maxUses, expiryDate, bookId } = body;

    if (!code || discountValue === undefined) {
      return NextResponse.json({ error: 'Coupon code and discount value are required' }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : 100,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        bookId: bookId || null,
        active: true,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('Admin create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let code = searchParams.get('code');

    if (!id && !code) {
      try {
        const body = await request.json();
        id = body.id;
        code = body.code;
      } catch (_) {}
    }

    if (!id && !code) {
      return NextResponse.json({ error: 'Coupon ID or code is required' }, { status: 400 });
    }

    // Find the coupon to ensure it exists
    const coupon = id
      ? await db.coupon.findUnique({ where: { id } })
      : await db.coupon.findUnique({ where: { code: code!.toUpperCase().trim() } });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found or already removed' }, { status: 404 });
    }

    // Detach any purchases referencing this coupon so foreign key doesn't fail
    await db.purchase.updateMany({
      where: { couponId: coupon.id },
      data: { couponId: null },
    });

    await db.coupon.delete({
      where: { id: coupon.id },
    });

    return NextResponse.json({ success: true, message: `Coupon ${coupon.code} deleted successfully` });
  } catch (error: any) {
    console.error('Admin delete coupon error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
