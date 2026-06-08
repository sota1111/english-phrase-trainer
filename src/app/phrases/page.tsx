import { PhrasesClient } from './PhrasesClient';

export default async function PhrasesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let phrases = [];
  try {
    const res = await fetch(`${baseUrl}/api/phrases`, { cache: 'no-store' });
    if (res.ok) {
      phrases = await res.json();
    }
  } catch {
    // Firestore not available at build time, start with empty list
  }
  return <PhrasesClient initialPhrases={phrases} />;
}
