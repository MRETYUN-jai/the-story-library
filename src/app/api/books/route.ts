import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const series = searchParams.get('series');

    const whereClause: any = {
      status: 'PUBLISHED',
    };

    if (series) {
      whereClause.series = { slug: series };
    }

    const books = await db.book.findMany({
      where: whereClause,
      include: {
        series: true,
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: [
        { seriesId: 'asc' },
        { bookNumber: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Books API error:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}
