import { SpacedReviewClient } from '@/components/reviews/SpacedReviewClient';
import { ImportancePicker } from '@/components/reviews/ImportancePicker';
import { T } from '@/i18n/T';
import { getDuePhrasesAction } from '@/lib/actions/reviewActions';
import { isImportance } from '@/lib/importance';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

export default async function SpacedReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ importance?: string }>;
}) {
  const { importance: importanceParam } = await searchParams;
  const importance = isImportance(importanceParam) ? importanceParam : null;

  let items: Parameters<typeof SpacedReviewClient>[0]['items'] = [];
  try {
    items = await getDuePhrasesAction(importance ?? undefined) as Parameters<typeof SpacedReviewClient>[0]['items'];
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}><T k="review.title" /></h1>
      <ImportancePicker basePath="/spaced-review" current={importance} />
      <SpacedReviewClient items={items as Parameters<typeof SpacedReviewClient>[0]['items']} />
    </div>
  );
}
