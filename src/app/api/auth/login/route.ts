import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 👑 Admin Security Passcode: No email OTP is sent for Admins. Uses 6-digit passcode "050807"
    if (user.role === 'ADMIN') {
      await db.user.update({
        where: { id: user.id },
        data: { verificationToken: '050807' },
      });

      return NextResponse.json({
        success: true,
        requiresOtp: true,
        isAdmin: true,
        email: user.email,
        message: 'Enter the 6-digit Admin Security Passcode to verify.',
      });
    }

    // Generate fresh 6-digit OTP for regular reader email verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await db.user.update({
      where: { id: user.id },
      data: { verificationToken: otpCode },
    });

    // Dispatch real email via Gmail SMTP
    const emailResult = await sendOtpEmail({
      to: user.email,
      code: otpCode,
      type: 'login',
      userName: user.name,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Unable to deliver OTP email: ${emailResult.error || 'Check email configuration.'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: user.email,
      message: 'A 6-digit verification code has been sent directly to your Gmail inbox.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
