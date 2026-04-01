import { db } from './db';

export type ActivityAction = 
  | 'book_added'
  | 'book_updated'
  | 'book_deleted'
  | 'book_issued'
  | 'book_returned'
  | 'settings_changed';

interface LogActivityParams {
  action: ActivityAction;
  bookId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await db.activityLog.create({
      data: {
        action: params.action,
        bookId: params.bookId,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export function getActivityIcon(action: string): string {
  const icons: Record<string, string> = {
    book_added: '📚',
    book_updated: '✏️',
    book_deleted: '🗑️',
    book_issued: '📤',
    book_returned: '📥',
    settings_changed: '⚙️'
  };
  return icons[action] || '📝';
}

export function getActivityColor(action: string): string {
  const colors: Record<string, string> = {
    book_added: 'text-green-600 dark:text-green-400',
    book_updated: 'text-blue-600 dark:text-blue-400',
    book_deleted: 'text-red-600 dark:text-red-400',
    book_issued: 'text-orange-600 dark:text-orange-400',
    book_returned: 'text-teal-600 dark:text-teal-400',
    settings_changed: 'text-gray-600 dark:text-gray-400'
  };
  return colors[action] || 'text-gray-600 dark:text-gray-400';
}
