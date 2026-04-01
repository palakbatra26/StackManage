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
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { borrowerName: { contains: search } },
        { borrowerId: { contains: search } },
        { book: { title: { contains: search } } }
      ];
    }

    // Update overdue status
    await db.issue.updateMany({
      where: {
        status: 'issued',
        dueDate: { lt: new Date() }
      },
      data: { status: 'overdue' }
    });

    const [issues, total] = await Promise.all([
      db.issue.findMany({
        where,
        include: { book: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.issue.count({ where })
    ]);

    return NextResponse.json({
      issues,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
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
    const { bookId, borrowerName, borrowerId, dueDate, notes } = body;

    if (!bookId || !borrowerName) {
      return NextResponse.json(
        { error: 'Book ID and borrower name are required' },
        { status: 400 }
      );
    }

    const book = await db.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.availableCopies <= 0) {
      return NextResponse.json(
        { error: 'No copies available for issue' },
        { status: 400 }
      );
    }

    // Default due date is 14 days from now
    const issueDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const issue = await db.issue.create({
      data: {
        bookId,
        borrowerName,
        borrowerId,
        dueDate: issueDueDate,
        notes,
        status: 'issued'
      }
    });

    // Decrease available copies
    await db.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } }
    });

    await logActivity({
      action: 'book_issued',
      bookId,
      description: `Issued "${book.title}" to ${borrowerName}`,
      metadata: { borrowerName, borrowerId, dueDate: issueDueDate.toISOString() }
    });

    return NextResponse.json({ issue, message: 'Book issued successfully' });
  } catch (error) {
    console.error('Create issue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
