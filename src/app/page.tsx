import Link from 'next/link';
import { StatsCard } from '@/components/StatsCard';

type Stats = {
  totalPhrases: number;
  answeredPhrases: number;
  unansweredPhrases: number;
  weakPhrases: number;
  averageAccuracy: number;
};

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let stats: Stats = { totalPhrases: 0, answeredPhrases: 0, unansweredPhrases: 0, weakPhrases: 0, averageAccuracy: 0 };
  try {
    const res = await fetch(`${baseUrl}/api/stats`, { cache: 'no-store' });
    if (res.ok) stats = await res.json();
  } catch { /* Firestore unavailable at build time */ }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>英語フレーズ学習アプリ</h1>
      <p>フレーズを登録して、クイズで学習しましょう。</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', margin: '2rem 0' }}>
        <StatsCard label="登録フレーズ数" value={stats.totalPhrases} />
        <StatsCard label="回答済み" value={stats.answeredPhrases} />
        <StatsCard label="未回答" value={stats.unansweredPhrases} />
        <StatsCard label="苦手フレーズ" value={stats.weakPhrases} description="正答率50%未満" />
        <StatsCard
          label="平均正答率"
          value={stats.answeredPhrases > 0 ? `${Math.round(stats.averageAccuracy * 100)}%` : '-'}
        />
      </section>

      <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/review" style={{ padding: '0.75rem 1.5rem', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}>
          復習クイズを開始
        </Link>
        <Link href="/phrases" style={{ padding: '0.75rem 1.5rem', background: '#f0f0f0', color: '#333', borderRadius: '6px', textDecoration: 'none' }}>
          フレーズ管理
        </Link>
        <Link href="/weak" style={{ padding: '0.75rem 1.5rem', background: '#f0f0f0', color: '#333', borderRadius: '6px', textDecoration: 'none' }}>
          苦手フレーズ一覧
        </Link>
      </nav>
    </main>
  );
}
