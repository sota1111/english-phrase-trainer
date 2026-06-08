import { ReviewSetupClient } from './ReviewSetupClient';

export default async function ReviewPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let categories: string[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/phrases`, { cache: 'no-store' });
    if (res.ok) {
      const phrases = await res.json();
      categories = Array.from(new Set(phrases.map((p: { category: string }) => p.category).filter(Boolean))) as string[];
    }
  } catch {
    /* Firestore unavailable at build time */
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ReviewSetupClient categories={categories} />
    </div>
  );
}
