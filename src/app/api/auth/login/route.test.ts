import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const ORIGINAL_ENV = process.env;

function createLoginRequest(email = 'user@example.com') {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password',
    }),
  });
}

function mockFirebaseSignIn(email = 'user@example.com') {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ email }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.AUTH_SECRET = 'test-secret';
    process.env.ALLOWED_USER_EMAILS = 'user@example.com';
    delete process.env.FIREBASE_WEB_API_KEY;
    delete process.env.FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = ORIGINAL_ENV;
  });

  it('succeeds and sets auth_token when only NEXT_PUBLIC_FIREBASE_API_KEY is configured', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'public-build-time-key';
    const fetchMock = mockFirebaseSignIn('user@example.com');

    const response = await POST(createLoginRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(response.headers.get('set-cookie')).toContain('auth_token=');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=public-build-time-key',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('allows emails that differ from the allowlist only by case', async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'public-build-time-key';
    process.env.ALLOWED_USER_EMAILS = 'Allowed.User@Example.com';
    mockFirebaseSignIn('allowed.user@example.com');

    const response = await POST(createLoginRequest('Allowed.User@Example.com'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(response.headers.get('set-cookie')).toContain('auth_token=');
  });
});
