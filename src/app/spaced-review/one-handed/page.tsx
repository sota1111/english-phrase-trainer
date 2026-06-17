import { OneHandedReviewClient, ReviewItem } from '@/components/reviews/OneHandedReviewClient';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';

export default async function OneHandedReviewPage() {
  let items: ReviewItem[] = [];
  try {
    items = await getDuePhrasesAction() as ReviewItem[];
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <OneHandedReviewClient items={items} />
    </div>
  );
}
