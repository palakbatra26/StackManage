import { NextResponse } from 'next/server';
import { verifyPassword, createSession, setSessionCookie, isAuthenticated } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check if already authenticated
    const authenticated = await isAuthenticated();
    if (authenticated) {
      return NextResponse.json({ success: true, message: 'Already authenticated' });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(password);
    
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const sessionId = await createSession();
    await setSessionCookie(sessionId);

    return NextResponse.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
