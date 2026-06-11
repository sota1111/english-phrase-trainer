import { CalendarClient } from './CalendarClient';

export default async function CalendarPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let data = { year, month, streakDays: 0, days: [] as { date: string; reviewCount: number; correctCount: number }[] };
  try {
    const res = await fetch(`${baseUrl}/api/calendar?year=${year}&month=${month}`, { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch {
    /* Firestore unavailable at build time */
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← ホーム</a>
        <h1 style={{ margin: 0 }}>学習カレンダー</h1>
      </div>
      <CalendarClient initialData={data} />
    </div>
  );
}
