import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const availability = searchParams.get('availability') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (availability === 'available') {
      where.availableCopies = { gt: 0 };
    } else if (availability === 'unavailable') {
      where.availableCopies = { equals: 0 };
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.book.count({ where })
    ]);

    return NextResponse.json({
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, author, isbn, category, quantity, rackLocation, publishedYear, description } = body;

    if (!title || !author || !isbn) {
      return NextResponse.json(
        { error: 'Title, author, and ISBN are required' },
        { status: 400 }
      );
    }

    // Check if ISBN already exists
    const existingBook = await db.book.findUnique({
      where: { isbn }
    });

    if (existingBook) {
      return NextResponse.json(
        { error: 'A book with this ISBN already exists' },
        { status: 400 }
      );
    }

    const bookQuantity = quantity || 1;

    const book = await db.book.create({
      data: {
        title,
        author,
        isbn,
        category: category || 'General',
        quantity: bookQuantity,
        availableCopies: bookQuantity,
        rackLocation,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        description
      }
    });

    await logActivity({
      action: 'book_added',
      bookId: book.id,
      description: `Added book "${title}" by ${author}`,
      metadata: { isbn, category, quantity: bookQuantity }
    });

    return NextResponse.json({ book, message: 'Book added successfully' });
  } catch (error) {
    console.error('Create book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
