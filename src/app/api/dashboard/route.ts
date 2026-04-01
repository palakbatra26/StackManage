import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update overdue status first
    await db.issue.updateMany({
      where: {
        status: 'issued',
        dueDate: { lt: new Date() }
      },
      data: { status: 'overdue' }
    });

    // Get basic counts
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCount,
      overdueCount,
      returnedCount,
      categoryStats,
      recentActivity,
      lowStockBooks
    ] = await Promise.all([
      db.book.count(),
      db.book.aggregate({ _sum: { quantity: true } }),
      db.book.aggregate({ _sum: { availableCopies: true } }),
      db.issue.count({ where: { status: { in: ['issued', 'overdue'] } } }),
      db.issue.count({ where: { status: 'overdue' } }),
      db.issue.count({ where: { status: 'returned' } }),
      db.book.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      db.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { book: { select: { title: true, author: true } } }
      }),
      db.book.findMany({
        where: {
          OR: [
            { quantity: { lte: 2 } },
            { availableCopies: { lte: 1 } }
          ]
        },
        take: 5,
        orderBy: { availableCopies: 'asc' }
      })
    ]);

    // Get monthly issue stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyIssues = await db.issue.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: sixMonthsAgo }
      },
      _count: { id: true }
    });

    // Get recently issued books (not returned)
    const recentlyIssued = await db.issue.findMany({
      where: { status: { in: ['issued', 'overdue'] } },
      include: { book: { select: { title: true, author: true } } },
      orderBy: { issueDate: 'desc' },
      take: 5
    });

    return NextResponse.json({
      stats: {
        totalBooks,
        totalCopies: totalCopies._sum.quantity || 0,
        availableCopies: availableCopies._sum.availableCopies || 0,
        issuedBooks: issuedCount,
        overdueBooks: overdueCount,
        returnedBooks: returnedCount,
        availablePercentage: totalCopies._sum.quantity 
          ? Math.round(((availableCopies._sum.availableCopies || 0) / totalCopies._sum.quantity) * 100)
          : 0
      },
      categoryStats: categoryStats.map(c => ({
        category: c.category,
        count: c._count.id
      })),
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        action: a.action,
        description: a.description,
        book: a.book,
        createdAt: a.createdAt
      })),
      lowStockBooks,
      recentlyIssued,
      monthlyIssues: monthlyIssues.map(m => ({
        status: m.status,
        count: m._count.id
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
