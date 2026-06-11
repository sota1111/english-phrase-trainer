import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

function computeToken(secret: string): string {
  return createHmac('sha256', secret)
    .update('english-phrase-trainer-auth')
    .digest('hex');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const authPassword = process.env.AUTH_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  if (!authPassword || !authSecret || !password) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
  }

  let isValid = false;
  try {
    const inputBuf = Buffer.from(password);
    const expectedBuf = Buffer.from(authPassword);
    if (inputBuf.length === expectedBuf.length) {
      isValid = timingSafeEqual(inputBuf, expectedBuf);
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 });
  }

  const token = computeToken(authSecret);
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
