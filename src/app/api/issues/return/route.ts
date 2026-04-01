import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { issueId, notes } = body;

    if (!issueId) {
      return NextResponse.json(
        { error: 'Issue ID is required' },
        { status: 400 }
      );
    }

    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: { book: true }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.status === 'returned') {
      return NextResponse.json(
        { error: 'Book already returned' },
        { status: 400 }
      );
    }

    const now = new Date();
    const wasOverdue = issue.dueDate < now;

    const updatedIssue = await db.issue.update({
      where: { id: issueId },
      data: {
        status: 'returned',
        returnDate: now,
        notes: notes || issue.notes
      }
    });

    // Increase available copies
    await db.book.update({
      where: { id: issue.bookId },
      data: { availableCopies: { increment: 1 } }
    });

    await logActivity({
      action: 'book_returned',
      bookId: issue.bookId,
      description: `Returned "${issue.book.title}" by ${issue.borrowerName}${wasOverdue ? ' (was overdue)' : ''}`,
      metadata: { 
        borrowerName: issue.borrowerName, 
        wasOverdue,
        daysLate: wasOverdue ? Math.ceil((now.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    });

    return NextResponse.json({ 
      issue: updatedIssue, 
      message: 'Book returned successfully',
      wasOverdue 
    });
  } catch (error) {
    console.error('Return book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
