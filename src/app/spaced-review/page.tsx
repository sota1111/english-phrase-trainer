import { SpacedReviewClient } from '@/components/reviews/SpacedReviewClient';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';

export default async function SpacedReviewPage() {
  let items: Parameters<typeof SpacedReviewClient>[0]['items'] = [];
  try {
    items = await getDuePhrasesAction() as Parameters<typeof SpacedReviewClient>[0]['items'];
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>今日の復習</h1>
      <SpacedReviewClient items={items as Parameters<typeof SpacedReviewClient>[0]['items']} />
    </div>
  );
}
