import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { parseJson } from '@/lib/validation/api-helper';
import { loginSchema } from '@/lib/validation/schemas';

const IDENTITY_TOOLKIT_SIGN_IN_URL =
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

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
  const { email, password } = result.data;

  const authSecret = process.env.AUTH_SECRET;
  const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY;
  const allowedEmails = process.env.ALLOWED_USER_EMAILS
    ? process.env.ALLOWED_USER_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  if (!authSecret || !apiKey) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 500 });
  }

  // Server-side credential verification via Firebase Identity Toolkit REST API.
  // The browser never talks to Firebase directly and the password is never logged.
  let verifiedEmail: string;
  try {
    const verifyResponse = await fetch(`${IDENTITY_TOOLKIT_SIGN_IN_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await verifyResponse.json().catch(() => ({}));

    if (!verifyResponse.ok) {
      const code: string = data?.error?.message ?? '';
      if (code.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        return NextResponse.json(
          { error: 'ログイン試行が多すぎます。しばらく待ってから再試行してください' },
          { status: 429 },
        );
      }
      if (
        code === 'EMAIL_NOT_FOUND' ||
        code === 'INVALID_PASSWORD' ||
        code.startsWith('INVALID_LOGIN_CREDENTIALS')
      ) {
        return NextResponse.json(
          { error: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    verifiedEmail = data?.email ?? '';
  } catch {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
  }

  if (allowedEmails.length > 0 && !allowedEmails.includes(verifiedEmail)) {
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
