import { ReviewSessionClient } from './ReviewSessionClient';

type SearchParams = {
  mode?: string;
  category?: string;
  difficulty?: string;
  limit?: string;
};

export default async function ReviewSessionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const qs = new URLSearchParams({
    mode: params.mode ?? 'all',
    category: params.category ?? '',
    difficulty: params.difficulty ?? '',
    limit: params.limit ?? '10',
  }).toString();

  let phrases = [];
  try {
    const res = await fetch(`${baseUrl}/api/review?${qs}`, { cache: 'no-store' });
    if (res.ok) {
      phrases = await res.json();
    }
  } catch {
    /* build time */
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ReviewSessionClient initialPhrases={phrases} />
    </div>
  );
}
