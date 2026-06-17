import { SpacedReviewClient } from '@/components/reviews/SpacedReviewClient';

export default async function SpacedReviewPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let items: unknown[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/spaced-review`, { cache: 'no-store' });
    if (res.ok) items = await res.json();
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
