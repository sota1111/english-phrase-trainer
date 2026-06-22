import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { T } from '@/i18n/T';
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
        <h1 className="page-title"><T k="home.title" /></h1>
        <p className="page-subtitle"><T k="home.subtitle" /></p>
      </header>

      <section className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label={<T k="home.stat.due" />} value={data.dueCount} sub={<T k="unit.count" />} />
        <StatCard label={<T k="home.stat.todayReviews" />} value={data.todayReviewCount} sub={<T k="home.stat.todayCorrect" vars={{ n: data.todayCorrectCount }} />} />
        <StatCard label={<T k="home.stat.streak" />} value={data.streakDays} sub={<T k="unit.days" />} />
        <StatCard label={<T k="home.stat.totalReviews" />} value={data.totalReviews} sub={<T k="unit.times" />} />
      </section>

      <nav className="home-nav" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
        <Link href="/spaced-review" className="btn btn-primary">
          <T k="home.startReview" vars={{ count: data.dueCount }} />
        </Link>
        <Link href="/spaced-review/one-handed" className="btn btn-soft">
          <T k="home.oneHanded" />
        </Link>
        <Link href="/phrases" className="btn btn-ghost">
          <T k="home.managePhrases" />
        </Link>
        <Link href="/calendar" className="btn btn-ghost">
          <T k="home.calendar" />
        </Link>
        <Link href="/analytics" className="btn btn-ghost">
          <T k="home.analytics" />
        </Link>
        <Link href="/quiz" className="btn btn-ghost">
          <T k="home.quiz" />
        </Link>
        <Link href="/writing" className="btn btn-ghost">
          <T k="home.writing" />
        </Link>
      </nav>
    </main>
  );
}
