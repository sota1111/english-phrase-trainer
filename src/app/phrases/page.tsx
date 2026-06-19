import { PhrasesClient } from '@/components/phrases/PhrasesClient';
import { getPhrasesAction } from '@/lib/actions/phraseActions';
import { Phrase } from '@/types/phrase';

// Read live Firestore data on every request. Without this, Next.js statically
// prerenders this page at build time (when Firestore is unreachable in CI), bakes
// in an empty list, and serves that stale snapshot after deploy.
export const dynamic = 'force-dynamic';

export default async function PhrasesPage() {
  let phrases: Phrase[] = [];
  try {
    phrases = await getPhrasesAction();
  } catch {
    // Firestore not available at build time, start with empty list
  }
  return <PhrasesClient initialPhrases={phrases} />;
}
