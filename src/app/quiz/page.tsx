import { QuizClient } from '@/components/quiz/QuizClient';
import { QuizPhrase } from '@/lib/quiz';
import { getPhrasesAction } from '@/lib/actions/phraseActions';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  let phrases: QuizPhrase[] = [];
  try {
    const all = await getPhrasesAction();
    phrases = all.map((p) => ({
      id: p.id,
      phrase: p.phrase,
      meaningJa: p.meaningJa,
      example: p.example,
      exampleJa: p.exampleJa,
    }));
  } catch {
    /* Firestore unavailable at build time */
  }

  return <QuizClient phrases={phrases} />;
}
