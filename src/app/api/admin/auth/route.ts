/**
 * Admin Authentication API
 *
 * POST /api/admin/auth - Login with username/password, returns session cookie.
 * DELETE /api/admin/auth - Logout, clears session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, setSessionCookie, clearSessionCookie } from '@/lib/adminAuth';

/**
 * Authenticates admin/auditor credentials and sets a signed session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const role = validateCredentials(username, password);
    if (!role) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, role });
    return setSessionCookie(response, role);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }
}

/**
 * Clears the admin session cookie (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
