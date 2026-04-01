import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function booksToCSV(books: Record<string, unknown>[]): string {
  const headers = [
    'Title', 'Author', 'ISBN', 'Category', 'Quantity', 'Available Copies',
    'Rack Location', 'Published Year', 'Created At', 'Updated At'
  ];
  
  const rows = books.map(book => [
    escapeCSV(book.title as string),
    escapeCSV(book.author as string),
    escapeCSV(book.isbn as string),
    escapeCSV(book.category as string),
    book.quantity as number,
    book.availableCopies as number,
    escapeCSV(book.rackLocation as string),
    book.publishedYear as number | null,
    (book.createdAt as Date).toISOString(),
    (book.updatedAt as Date).toISOString()
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

function issuesToCSV(issues: Record<string, unknown>[]): string {
  const headers = [
    'Book Title', 'Book Author', 'Borrower Name', 'Borrower ID',
    'Issue Date', 'Due Date', 'Return Date', 'Status', 'Notes'
  ];
  
  const rows = issues.map(issue => [
    escapeCSV((issue.book as Record<string, string>)?.title),
    escapeCSV((issue.book as Record<string, string>)?.author),
    escapeCSV(issue.borrowerName as string),
    escapeCSV(issue.borrowerId as string),
    (issue.issueDate as Date).toISOString(),
    (issue.dueDate as Date).toISOString(),
    issue.returnDate ? (issue.returnDate as Date).toISOString() : '',
    escapeCSV(issue.status as string),
    escapeCSV(issue.notes as string)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'books';
    const format = searchParams.get('format') || 'csv';

    let csvContent: string;
    let filename: string;

    if (type === 'books') {
      const books = await db.book.findMany({
        orderBy: { createdAt: 'desc' }
      });
      csvContent = booksToCSV(books);
      filename = `library_books_${new Date().toISOString().split('T')[0]}`;
    } else if (type === 'issues') {
      const issues = await db.issue.findMany({
        include: { book: { select: { title: true, author: true } } },
        orderBy: { createdAt: 'desc' }
      });
      csvContent = issuesToCSV(issues);
      filename = `library_issues_${new Date().toISOString().split('T')[0]}`;
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (format === 'csv') {
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }

    // For Excel, we'll return CSV with Excel-compatible content type
    return new NextResponse('\ufeff' + csvContent, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${filename}.xls"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
