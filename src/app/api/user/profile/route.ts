import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        email: true,
        role: true,
        createdAt: true,
        purchases: {
          where: { status: 'SUCCESS' },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                genre: true,
              },
            },
          },
          orderBy: { purchasedAt: 'desc' },
        },
        readingProgress: {
          select: {
            id: true,
            bookId: true,
            pageNumber: true,
            positionPercent: true,
            lastReadAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname || '',
        avatar: user.avatar || '/avatars/scholar.png',
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats: {
        purchasedCount: user.purchases.length,
        inProgressCount: user.readingProgress.length,
      },
      purchases: user.purchases.map((p) => p.book),
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, nickname, avatar } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Username must be at least 2 characters long' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanNickname = typeof nickname === 'string' ? nickname.trim() : null;
    const cleanAvatar = typeof avatar === 'string' && avatar.trim() ? avatar.trim() : '/avatars/scholar.png';

    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        name: cleanName,
        nickname: cleanNickname || null,
        avatar: cleanAvatar,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Protect primary admin from accidental self-deletion
    const emailLower = sessionUser.email.toLowerCase();
    if (
      emailLower === 'admin@mj.com' ||
      emailLower === 'admin@mretyunjai.com' ||
      emailLower === 'the.story.vault.2306@gmail.com' ||
      sessionUser.role === 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'The primary author/administrator account cannot be deleted.' },
        { status: 403 }
      );
    }

    const userId = sessionUser.id;

    // Atomic transaction: Delete bookmarks, reading progress, purchased books, and the user record
    await db.$transaction(async (tx) => {
      // 1. Delete all bookmarks
      await tx.bookmark.deleteMany({
        where: { userId },
      });

      // 2. Delete all reading progress
      await tx.readingProgress.deleteMany({
        where: { userId },
      });

      // 3. Delete all book purchases (every book they brought)
      await tx.purchase.deleteMany({
        where: { userId },
      });

      // 4. Delete the user record completely
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Clear session token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Your account, purchased books, and reader history have been permanently deleted.',
    });

    response.cookies.set('stl_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

