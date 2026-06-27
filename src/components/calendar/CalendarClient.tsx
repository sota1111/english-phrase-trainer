'use client';

import { useState } from 'react';
import { getMonthlyStatsAction } from '@/lib/actions/statsActions';
import { useI18n } from '@/i18n/I18nContext';

type DayData = {
  date: string;
  reviewCount: number;
  correctCount: number;
};

type CalendarData = {
  year: number;
  month: number;
  streakDays: number;
  days: DayData[];
};

type Props = {
  initialData: CalendarData;
};

function getDayColor(reviewCount: number): string {
  if (reviewCount === 0) return '#ebedf0';
  if (reviewCount <= 5) return '#9ecbff';
  if (reviewCount <= 10) return '#4493f8';
  return '#0a3069';
}

export function CalendarClient({ initialData }: Props) {
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(initialData.year);
  const [month, setMonth] = useState(initialData.month);
  const [data, setData] = useState<CalendarData>(initialData);
  const [loading, setLoading] = useState(false);

  const navigate = async (newYear: number, newMonth: number) => {
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setLoading(true);
    try {
      const d = await getMonthlyStatsAction(newYear, newMonth);
      setData(d);
      setYear(newYear);
      setMonth(newMonth);
    } finally {
      setLoading(false);
    }
  };

  const dayMap = new Map(data.days.map(d => [d.date, d]));

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = firstDay.getDay(); // 0=Sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const todayStr = now.toISOString().slice(0, 10);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(year, month - 1)}
          style={{ padding: '0.5rem 1rem', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
        >
          ◀
        </button>
        <h2 style={{ margin: 0 }}>{t('calendar.ymd', { year, month })}</h2>
        <button
          onClick={() => navigate(year, month + 1)}
          disabled={isCurrentMonth}
          style={{ padding: '0.5rem 1rem', background: isCurrentMonth ? '#f0f0f0' : '#f0f0f0', border: 'none', borderRadius: '6px', cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: '1rem', opacity: isCurrentMonth ? 0.4 : 1 }}
        >
          ▶
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#666' }}>{t('calendar.loading')}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '1.5rem' }}>
        {[0, 1, 2, 3, 4, 5, 6].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: '#666', padding: '0.25rem' }}>{t(`calendar.dow${d}`)}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
          const dayData = dayMap.get(dateStr);
          const reviewCount = dayData?.reviewCount ?? 0;
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              title={reviewCount > 0 ? t('calendar.reviewCount', { count: reviewCount }) : ''}
              style={{
                aspectRatio: '1',
                borderRadius: '4px',
                background: getDayColor(reviewCount),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                color: reviewCount >= 6 ? '#fff' : '#333',
                border: isToday ? '2px solid #0070f3' : '2px solid transparent',
                cursor: reviewCount > 0 ? 'default' : 'default',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('calendar.less')}</span>
        {[0, 3, 7, 11].map(count => (
          <div key={count} style={{ width: '16px', height: '16px', borderRadius: '3px', background: getDayColor(count) }} />
        ))}
        <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('calendar.more')}</span>
      </div>

      <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.streakDays}</span>
        <span style={{ color: '#555', marginLeft: '0.5rem' }}>{t('calendar.streakSuffix')}</span>
      </div>
    </div>
  );
}
