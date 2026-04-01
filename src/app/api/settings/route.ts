import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { setAdminPassword, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.settings.findMany({
      where: {
        key: { not: ['admin_password', 'session'] }
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (currentPassword && newPassword) {
      // Change password
      const storedPassword = await db.settings.findUnique({
        where: { key: 'admin_password' }
      });

      if (!storedPassword || storedPassword.value !== await hashPassword(currentPassword)) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      await setAdminPassword(newPassword);

      await logActivity({
        action: 'settings_changed',
        description: 'Changed admin password'
      });

      return NextResponse.json({ message: 'Password changed successfully' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
