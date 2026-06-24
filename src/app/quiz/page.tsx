import { QuizHubClient } from '@/components/quiz/QuizHubClient';
import { SpacedReviewClient } from '@/components/reviews/SpacedReviewClient';
import { QuizPhrase } from '@/lib/quiz';
import { getPhrasesAction } from '@/lib/actions/phraseActions';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';

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

  let reviewItems: Parameters<typeof SpacedReviewClient>[0]['items'] = [];
  try {
    reviewItems = (await getDuePhrasesAction()) as Parameters<typeof SpacedReviewClient>[0]['items'];
  } catch {
    /* Firestore unavailable at build time */
  }

  return <QuizHubClient phrases={phrases} reviewItems={reviewItems} />;
}
