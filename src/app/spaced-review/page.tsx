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
  searchParams: Promise<{ importance?: string; deck?: string }>;
}) {
  const { importance: importanceParam, deck: deckParam } = await searchParams;
  const importance = isImportance(importanceParam) ? importanceParam : null;
  const deck = deckParam && deckParam.trim() ? deckParam.trim() : null;

  let items: Parameters<typeof SpacedReviewClient>[0]['items'] = [];
  try {
    items = await getDuePhrasesAction(importance ?? undefined, deck ?? undefined) as Parameters<typeof SpacedReviewClient>[0]['items'];
  } catch {
    /* Firestore unavailable at build time */
  }

  // Preserve the deck scope when switching importance.
  const basePath = deck ? `/spaced-review?deck=${encodeURIComponent(deck)}` : '/spaced-review';

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}><T k="review.title" /></h1>
      {deck && (
        <p style={{ marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
          <T k="decks.reviewing" vars={{ name: deck }} />
        </p>
      )}
      <ImportancePicker basePath={basePath} current={importance} />
      <SpacedReviewClient items={items as Parameters<typeof SpacedReviewClient>[0]['items']} />
    </div>
  );
}
