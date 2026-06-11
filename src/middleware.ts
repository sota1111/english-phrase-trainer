import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function computeToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('english-phrase-trainer-auth'),
  );

  return toHex(signature);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (!/^[0-9a-f]+$/i.test(a) || !/^[0-9a-f]+$/i.test(b)) {
    return false;
  }

  const aBytes = encoder.encode(a.toLowerCase());
  const bBytes = encoder.encode(b.toLowerCase());
  let mismatch = aBytes.length ^ bBytes.length;
  const length = Math.max(aBytes.length, bBytes.length);

  for (let index = 0; index < length; index += 1) {
    mismatch |= (aBytes[index] ?? 0) ^ (bBytes[index] ?? 0);
  }

  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
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

  const expected = await computeToken(authSecret);
  try {
    if (!timingSafeHexEqual(cookieToken, expected)) {
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
