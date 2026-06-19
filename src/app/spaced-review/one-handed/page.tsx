import { OneHandedReviewClient, ReviewItem } from '@/components/reviews/OneHandedReviewClient';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

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
