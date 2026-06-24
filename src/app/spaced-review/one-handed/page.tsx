import { OneHandedReviewClient, ReviewItem } from '@/components/reviews/OneHandedReviewClient';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';
import { isImportance } from '@/lib/importance';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

export default async function OneHandedReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ importance?: string }>;
}) {
  const { importance: importanceParam } = await searchParams;
  const importance = isImportance(importanceParam) ? importanceParam : null;

  let items: ReviewItem[] = [];
  try {
    items = await getDuePhrasesAction(importance ?? undefined) as ReviewItem[];
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ height: 'var(--onehand-h)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <OneHandedReviewClient items={items} />
    </div>
  );
}
