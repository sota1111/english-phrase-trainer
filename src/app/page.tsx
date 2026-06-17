import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';

type DashboardData = {
  dueCount: number;
  todayReviewCount: number;
  todayCorrectCount: number;
  streakDays: number;
  totalReviews: number;
  monthlyStats: { date: string; reviewCount: number }[];
};

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let data: DashboardData = {
    dueCount: 0,
    todayReviewCount: 0,
    todayCorrectCount: 0,
    streakDays: 0,
    totalReviews: 0,
    monthlyStats: [],
  };
  try {
    const res = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch { /* Firestore unavailable at build time */ }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>英語フレーズ学習</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>忘却曲線に基づいて効率よく復習しましょう。</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="今日の復習" value={data.dueCount} sub="件" />
        <StatCard label="本日の復習数" value={data.todayReviewCount} sub={`正解 ${data.todayCorrectCount} 件`} />
        <StatCard label="継続学習日数" value={data.streakDays} sub="日" />
        <StatCard label="総復習回数" value={data.totalReviews} sub="回" />
      </section>

      <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link href="/spaced-review" style={{ padding: '0.75rem 1.5rem', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
          復習を開始 ({data.dueCount}件)
        </Link>
        <Link href="/spaced-review/one-handed" style={{ padding: '0.75rem 1.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #bae6fd' }}>
          片手モードで復習
        </Link>
        <Link href="/phrases" style={{ padding: '0.75rem 1.5rem', background: '#f0f0f0', color: '#333', borderRadius: '6px', textDecoration: 'none' }}>
          フレーズ管理
        </Link>
        <Link href="/calendar" style={{ padding: '0.75rem 1.5rem', background: '#f0f0f0', color: '#333', borderRadius: '6px', textDecoration: 'none' }}>
          学習カレンダー
        </Link>
      </nav>
    </main>
  );
}
