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
});
