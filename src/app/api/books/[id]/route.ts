import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const book = await db.book.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Get book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, author, isbn, category, quantity, rackLocation, publishedYear, description } = body;

    const existingBook = await db.book.findUnique({
      where: { id }
    });

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if ISBN is being changed and if it conflicts with another book
    if (isbn && isbn !== existingBook.isbn) {
      const bookWithIsbn = await db.book.findUnique({
        where: { isbn }
      });
      if (bookWithIsbn) {
        return NextResponse.json(
          { error: 'A book with this ISBN already exists' },
          { status: 400 }
        );
      }
    }

    // Calculate new available copies
    const newQuantity = quantity !== undefined ? quantity : existingBook.quantity;
    const issuedCount = existingBook.quantity - existingBook.availableCopies;
    const newAvailableCopies = Math.max(0, newQuantity - issuedCount);

    const book = await db.book.update({
      where: { id },
      data: {
        title: title || existingBook.title,
        author: author || existingBook.author,
        isbn: isbn || existingBook.isbn,
        category: category !== undefined ? category : existingBook.category,
        quantity: newQuantity,
        availableCopies: newAvailableCopies,
        rackLocation: rackLocation !== undefined ? rackLocation : existingBook.rackLocation,
        publishedYear: publishedYear !== undefined ? (publishedYear ? parseInt(publishedYear) : null) : existingBook.publishedYear,
        description: description !== undefined ? description : existingBook.description
      }
    });

    await logActivity({
      action: 'book_updated',
      bookId: book.id,
      description: `Updated book "${book.title}" by ${book.author}`,
      metadata: { fields: Object.keys(body) }
    });

    return NextResponse.json({ book, message: 'Book updated successfully' });
  } catch (error) {
    console.error('Update book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const book = await db.book.findUnique({
      where: { id },
      include: { issues: { where: { status: 'issued' } } }
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.issues.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a book that is currently issued' },
        { status: 400 }
      );
    }

    await db.book.delete({
      where: { id }
    });

    await logActivity({
      action: 'book_deleted',
      description: `Deleted book "${book.title}" by ${book.author}`,
      metadata: { isbn: book.isbn, category: book.category }
    });

    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
