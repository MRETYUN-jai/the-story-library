import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json({
      authorUpiId: process.env.NEXT_PUBLIC_AUTHOR_UPI_ID || 'mretyunjai006@oksbi',
      authorName: 'Mretyun Jai B',
    });
  }
}
