import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { adminAuth } from '@/lib/firebase-admin';
import { parseJson } from '@/lib/validation/api-helper';
import { loginSchema } from '@/lib/validation/schemas';

function computeToken(secret: string): string {
  return createHmac('sha256', secret)
    .update('english-phrase-trainer-auth')
    .digest('hex');
}

export async function POST(request: NextRequest) {
  const result = await parseJson(request, loginSchema);
  if (!result.success) {
    return result.response;
  }
  const { idToken } = result.data;

  const authSecret = process.env.AUTH_SECRET;
  const allowedEmails = process.env.ALLOWED_USER_EMAILS
    ? process.env.ALLOWED_USER_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  if (!authSecret || !idToken) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
  }

  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    email = decoded.email ?? '';
  } catch {
    return NextResponse.json({ error: '認証トークンが無効です' }, { status: 401 });
  }

  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return NextResponse.json({ error: 'このメールアドレスは許可されていません' }, { status: 403 });
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
