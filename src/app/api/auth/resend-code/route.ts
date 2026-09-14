import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Generate fresh 6-digit OTP code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.user.update({
      where: { id: user.id },
      data: { verificationToken: newCode },
    });

    // Dispatch fresh OTP email
    const emailResult = await sendOtpEmail({
      to: trimmedEmail,
      code: newCode,
      type: 'signup',
      userName: user.name,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Unable to deliver email: ${emailResult.error || 'Check email configuration.'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been sent directly to your Gmail inbox.',
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json({ error: 'Failed to resend verification code' }, { status: 500 });
  }
}
