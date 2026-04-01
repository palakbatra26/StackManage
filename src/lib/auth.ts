import { cookies } from 'next/headers';
import { db } from './db';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'library_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getAdminPassword(): Promise<string> {
  const setting = await db.settings.findUnique({
    where: { key: 'admin_password' }
  });
  
  if (!setting) {
    // Default password is 'admin123'
    const defaultPassword = await hashPassword('admin123');
    await db.settings.create({
      data: {
        key: 'admin_password',
        value: defaultPassword,
        description: 'Admin password for login'
      }
    });
    return defaultPassword;
  }
  
  return setting.value;
}

export async function setAdminPassword(password: string): Promise<void> {
  const hashedPassword = await hashPassword(password);
  await db.settings.upsert({
    where: { key: 'admin_password' },
    update: { value: hashedPassword },
    create: {
      key: 'admin_password',
      value: hashedPassword,
      description: 'Admin password for login'
    }
  });
}

export async function verifyPassword(password: string): Promise<boolean> {
  const storedPassword = await getAdminPassword();
  const hashedInput = await hashPassword(password);
  return storedPassword === hashedInput;
}

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.settings.upsert({
    where: { key: 'session' },
    update: { 
      value: JSON.stringify({ id: sessionId, expiresAt: expiresAt.toISOString() })
    },
    create: {
      key: 'session',
      value: JSON.stringify({ id: sessionId, expiresAt: expiresAt.toISOString() })
    }
  });
  
  return sessionId;
}

export async function validateSession(sessionId: string | undefined): Promise<boolean> {
  if (!sessionId) return false;
  
  const setting = await db.settings.findUnique({
    where: { key: 'session' }
  });
  
  if (!setting) return false;
  
  try {
    const session = JSON.parse(setting.value);
    return session.id === sessionId && new Date(session.expiresAt) > new Date();
  } catch {
    return false;
  }
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  
  await db.settings.delete({
    where: { key: 'session' }
  }).catch(() => {});
}

export async function isAuthenticated(): Promise<boolean> {
  const sessionId = await getSession();
  return validateSession(sessionId || undefined);
}
