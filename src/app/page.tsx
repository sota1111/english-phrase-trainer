import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { getDashboardDataAction } from '@/lib/actions/statsActions';

// Read live Firestore data on every request (avoid build-time static prerender).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getDashboardDataAction>> = {
    dueCount: 0,
    todayReviewCount: 0,
    todayCorrectCount: 0,
    streakDays: 0,
    totalReviews: 0,
    monthlyStats: [],
  };
  try {
    data = await getDashboardDataAction();
  } catch { /* Firestore unavailable at build time */ }

  return (
    <main className="container">
      <header className="page-header">
        <h1 className="page-title">今日の学習</h1>
        <p className="page-subtitle">忘却曲線に基づいて効率よく復習しましょう。</p>
      </header>

      <section className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="今日の復習" value={data.dueCount} sub="件" />
        <StatCard label="本日の復習数" value={data.todayReviewCount} sub={`正解 ${data.todayCorrectCount} 件`} />
        <StatCard label="継続学習日数" value={data.streakDays} sub="日" />
        <StatCard label="総復習回数" value={data.totalReviews} sub="回" />
      </section>

      <nav className="home-nav" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
        <Link href="/spaced-review" className="btn btn-primary">
          復習を開始（{data.dueCount}件）
        </Link>
        <Link href="/spaced-review/one-handed" className="btn btn-soft">
          片手モードで復習
        </Link>
        <Link href="/phrases" className="btn btn-ghost">
          フレーズ管理
        </Link>
        <Link href="/calendar" className="btn btn-ghost">
          学習カレンダー
        </Link>
      </nav>
    </main>
  );
}
