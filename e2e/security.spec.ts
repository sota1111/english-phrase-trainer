import { test, expect } from '@playwright/test';

test.describe('Security - CSRF Protection', () => {
  test('should return 403 for POST request without Origin/Referer', async ({ request }) => {
    // We try to POST to an API route without Origin/Referer headers
    const response = await request.post('/api/auth/logout', {
      headers: {
        // Specifically omit Origin and Referer
      }
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('CSRF validation failed');
  });

  test('should return 403 for POST request with mismatched Origin', async ({ request }) => {
    const response = await request.post('/api/auth/logout', {
      headers: {
        'Origin': 'https://malicious.example.com'
      }
    });

    expect(response.status()).toBe(403);
  });

  test('should accept POST when Origin matches the forwarded (proxy) origin', async ({ request, baseURL }) => {
    // Behind a TLS-terminating proxy (Cloud Run) the browser Origin is https://
    // while the container is reached over http://. The CSRF check must compare
    // against the forwarded origin, not the internal nextUrl origin.
    const host = new URL(baseURL!).host;
    const response = await request.post('/api/auth/logout', {
      headers: {
        'Origin': `https://${host}`,
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-Host': host,
      },
    });

    // Must pass the CSRF same-origin check (i.e. NOT 403 CSRF rejection).
    expect(response.status()).not.toBe(403);
  });
});
