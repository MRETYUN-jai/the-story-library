import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const upiSetting = await db.siteSetting.findUnique({
      where: { key: 'AUTHOR_UPI_ID' },
    });

    const nameSetting = await db.siteSetting.findUnique({
      where: { key: 'AUTHOR_NAME' },
    });

    return NextResponse.json({
      authorUpiId: upiSetting?.value || process.env.NEXT_PUBLIC_AUTHOR_UPI_ID || 'mretyunjai006@oksbi',
      authorName: nameSetting?.value || 'Mretyun Jai B',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { authorUpiId, authorName } = await request.json();

    if (!authorUpiId || !authorUpiId.includes('@')) {
      return NextResponse.json({
        error: 'Please provide a valid UPI ID (e.g. yourname@oksbi, author@okicici, or 9876543210@paytm)',
      }, { status: 400 });
    }

    await db.siteSetting.upsert({
      where: { key: 'AUTHOR_UPI_ID' },
      update: { value: authorUpiId.trim() },
      create: { key: 'AUTHOR_UPI_ID', value: authorUpiId.trim() },
    });

    if (authorName) {
      await db.siteSetting.upsert({
        where: { key: 'AUTHOR_NAME' },
        update: { value: authorName.trim() },
        create: { key: 'AUTHOR_NAME', value: authorName.trim() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'UPI settings saved successfully! All reader checkout QR codes and deep links updated.',
      authorUpiId: authorUpiId.trim(),
      authorName: (authorName || 'Mretyun Jai B').trim(),
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save settings' }, { status: 500 });
  }
}
