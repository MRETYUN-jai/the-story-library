import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // 🛡️ STRICT GMAIL ENFORCEMENT
    if (!GMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Only valid personal Gmail addresses (@gmail.com) are accepted for registration.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    // 6-digit verification OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await hashPassword(password);

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: 'An account with this Gmail address already exists. Please sign in.' },
          { status: 409 }
        );
      }

      // If user started registration before but didn't verify, update password and new code
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          passwordHash,
          verificationToken: verificationCode,
        },
      });

      // Send OTP to user's real Gmail inbox
      const emailResult = await sendOtpEmail({
        to: trimmedEmail,
        code: verificationCode,
        type: 'signup',
        userName: name.trim(),
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { error: `Unable to deliver verification email: ${emailResult.error || 'Check email configuration.'}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email: trimmedEmail,
        message: 'A 6-digit verification code has been sent directly to your Gmail inbox.',
      });
    }

    const isAuthorEmail =
      trimmedEmail === 'the.story.vault.2306@gmail.com' ||
      (process.env.EMAIL_USER && trimmedEmail === process.env.EMAIL_USER.toLowerCase().trim());

    // Create user with isVerified: false and verificationToken in Supabase
    await db.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: isAuthorEmail ? 'ADMIN' : 'USER',
        isVerified: false,
        verificationToken: verificationCode,
      },
    });

    // Send OTP to user's real Gmail inbox
    const emailResult = await sendOtpEmail({
      to: trimmedEmail,
      code: verificationCode,
      type: 'signup',
      userName: name.trim(),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Unable to deliver verification email: ${emailResult.error || 'Check email configuration.'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: trimmedEmail,
      message: 'A 6-digit verification code has been sent directly to your Gmail inbox.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to initiate account registration' }, { status: 500 });
  }
}

