import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

function computeToken(secret: string): string {
  return createHmac('sha256', secret)
    .update('english-phrase-trainer-auth')
    .digest('hex');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieToken = request.cookies.get('auth_token')?.value;
  if (!cookieToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const expected = computeToken(authSecret);
  try {
    const cookieBuf = Buffer.from(cookieToken, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (cookieBuf.length !== expectedBuf.length || !timingSafeEqual(cookieBuf, expectedBuf)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
