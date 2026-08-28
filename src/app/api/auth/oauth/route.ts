import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { provider, email, name } = await request.json();

    if (!email || !provider) {
      return NextResponse.json({ error: 'Email and provider are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name?.trim() || cleanEmail.split('@')[0];

    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Create new account for social login user with random secure password
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      user = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          role: 'USER',
          isVerified: true, // Social login emails are pre-verified by provider
        },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    });

    const response = NextResponse.json({
      success: true,
      message: `Signed in successfully via ${provider.toUpperCase()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('stl_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Social OAuth error:', error);
    return NextResponse.json({ error: 'Social authentication failed' }, { status: 500 });
  }
}
