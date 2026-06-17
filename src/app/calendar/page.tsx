import Link from 'next/link';
import { CalendarClient } from '@/components/calendar/CalendarClient';
import { getMonthlyStatsAction } from '@/lib/actions/statsActions';

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let data = { year, month, streakDays: 0, days: [] as { date: string; reviewCount: number; correctCount: number }[] };
  try {
    data = await getMonthlyStatsAction(year, month);
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← ホーム</Link>
        <h1 style={{ margin: 0 }}>学習カレンダー</h1>
      </div>
      <CalendarClient initialData={data} />
    </div>
  );
}
