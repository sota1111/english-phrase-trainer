// Startup auth-config check. Next.js runs `register()` once when a server
// instance boots, so missing auth settings are surfaced in Cloud Run logs at
// startup, distinguishing each required variable.
export async function register() {
  // Only run in the Node.js server runtime (env vars are not meaningful on edge).
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const firebaseApiKey =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authSecret = process.env.AUTH_SECRET;
  const allowedEmails = process.env.ALLOWED_USER_EMAILS;

  let missing = false;
  if (!firebaseApiKey) {
    console.warn('FIREBASE_WEB_API_KEY / FIREBASE_API_KEY not configured');
    missing = true;
  }
  if (!authSecret) {
    console.warn('AUTH_SECRET not configured');
    missing = true;
  }
  if (!allowedEmails) {
    console.warn('ALLOWED_USER_EMAILS not configured');
    missing = true;
  }
  if (!missing) {
    console.log('auth config OK');
  }
}
