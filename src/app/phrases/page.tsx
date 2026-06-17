import { PhrasesClient } from '@/components/phrases/PhrasesClient';
import { getPhrasesAction } from '@/lib/actions/phraseActions';
import { Phrase } from '@/types/phrase';

export default async function PhrasesPage() {
  let phrases: Phrase[] = [];
  try {
    phrases = await getPhrasesAction();
  } catch {
    // Firestore not available at build time, start with empty list
  }
  return <PhrasesClient initialPhrases={phrases} />;
}
