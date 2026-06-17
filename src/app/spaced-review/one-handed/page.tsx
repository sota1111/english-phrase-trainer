import { OneHandedReviewClient, ReviewItem } from '@/components/reviews/OneHandedReviewClient';

export default async function OneHandedReviewPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let items: ReviewItem[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/spaced-review`, { cache: 'no-store' });
    if (res.ok) items = await res.json();
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <OneHandedReviewClient items={items} />
    </div>
  );
}
