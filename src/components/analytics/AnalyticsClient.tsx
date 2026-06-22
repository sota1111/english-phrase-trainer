'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/I18nContext';

type Distribution = { key: string; count: number };
type WeakPhrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  accuracy: number;
  answeredCount: number;
};
type TrendDay = { date: string; reviewCount: number; correctCount: number };

export type AnalyticsData = {
  totalPhrases: number;
  answeredPhrases: number;
  unansweredPhrases: number;
  overallAccuracy: number;
  totalAnswered: number;
  distribution: Distribution[];
  weakPhrases: WeakPhrase[];
  dailyTrend: TrendDay[];
};

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { t } = useI18n();

  const hasData = data.totalPhrases > 0;
  const maxBucket = Math.max(1, ...data.distribution.map((d) => d.count));
  const maxTrend = Math.max(1, ...data.dailyTrend.map((d) => d.reviewCount));

  return (
    <div className="analytics">
      <header className="analytics-header">
        <Link href="/" className="back-home">{t('common.backHome')}</Link>
        <h1>{t('analytics.title')}</h1>
        <p className="subtitle">{t('analytics.subtitle')}</p>
      </header>

      {!hasData ? (
        <p className="empty">{t('analytics.empty')}</p>
      ) : (
        <>
          <section className="cards">
            <div className="card">
              <span className="card-label">{t('analytics.overallAccuracy')}</span>
              <span className="card-value">{Math.round(data.overallAccuracy * 100)}%</span>
              <span className="card-sub">{t('analytics.answeredTotal', { n: data.totalAnswered })}</span>
            </div>
            <div className="card">
              <span className="card-label">{t('analytics.answeredPhrases')}</span>
              <span className="card-value">{data.answeredPhrases}</span>
              <span className="card-sub">{t('analytics.ofTotal', { n: data.totalPhrases })}</span>
            </div>
            <div className="card">
              <span className="card-label">{t('analytics.unanswered')}</span>
              <span className="card-value">{data.unansweredPhrases}</span>
              <span className="card-sub">{t('unit.count')}</span>
            </div>
          </section>

          <section className="panel">
            <h2>{t('analytics.distribution')}</h2>
            {data.answeredPhrases === 0 ? (
              <p className="empty-sm">{t('analytics.noAnswered')}</p>
            ) : (
              <div className="dist">
                {data.distribution.map((b) => (
                  <div key={b.key} className="dist-row">
                    <span className="dist-label">{b.key}%</span>
                    <div className="dist-track">
                      <div
                        className="dist-bar"
                        style={{ width: `${(b.count / maxBucket) * 100}%` }}
                      />
                    </div>
                    <span className="dist-count">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>{t('analytics.weak')}</h2>
            {data.weakPhrases.length === 0 ? (
              <p className="empty-sm">{t('analytics.noWeak')}</p>
            ) : (
              <ul className="weak-list">
                {data.weakPhrases.map((p) => (
                  <li key={p.id} className="weak-item">
                    <div className="weak-text">
                      <span className="weak-phrase">{p.phrase}</span>
                      <span className="weak-meaning">{p.meaningJa}</span>
                    </div>
                    <span className="weak-acc">
                      {Math.round(p.accuracy * 100)}%
                      <span className="weak-count"> ({p.answeredCount})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>{t('analytics.trend')}</h2>
            {data.dailyTrend.length === 0 ? (
              <p className="empty-sm">{t('analytics.noTrend')}</p>
            ) : (
              <div className="trend">
                {data.dailyTrend.map((d) => (
                  <div key={d.date} className="trend-col" title={`${d.date}: ${d.reviewCount}`}>
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar"
                        style={{ height: `${(d.reviewCount / maxTrend) * 100}%` }}
                      />
                    </div>
                    <span className="trend-date">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <style jsx>{`
        .analytics {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .analytics-header {
          margin-bottom: 1.5rem;
        }
        .back-home {
          display: inline-block;
          margin-bottom: 0.5rem;
          padding: 0.35rem 0.75rem;
          background: var(--surface-muted);
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.85rem;
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .subtitle {
          margin: 0.25rem 0 0;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .empty {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
        }
        .empty-sm {
          color: var(--muted);
          font-size: 0.9rem;
          margin: 0.5rem 0 0;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .card {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 1rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
        }
        .card-label {
          font-size: 0.85rem;
          color: var(--muted);
        }
        .card-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .card-sub {
          font-size: 0.8rem;
          color: var(--muted);
        }
        .panel {
          padding: 1.25rem;
          margin-bottom: 1.25rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .panel h2 {
          margin: 0 0 0.75rem;
          font-size: 1.05rem;
        }
        .dist-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .dist-label {
          flex: 0 0 4rem;
          font-size: 0.85rem;
          color: var(--muted);
          text-align: right;
        }
        .dist-track {
          flex: 1;
          height: 1.1rem;
          background: var(--surface-muted);
          border-radius: 6px;
          overflow: hidden;
        }
        .dist-bar {
          height: 100%;
          background: var(--primary);
          border-radius: 6px;
          min-width: 2px;
        }
        .dist-count {
          flex: 0 0 2rem;
          font-size: 0.85rem;
          color: var(--foreground);
        }
        .weak-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .weak-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .weak-item:last-child {
          border-bottom: 0;
        }
        .weak-text {
          display: flex;
          flex-direction: column;
        }
        .weak-phrase {
          font-weight: 600;
          color: var(--foreground);
        }
        .weak-meaning {
          font-size: 0.85rem;
          color: var(--muted);
        }
        .weak-acc {
          font-weight: 700;
          color: #e11d48;
          white-space: nowrap;
        }
        .weak-count {
          font-weight: 400;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .trend {
          display: flex;
          align-items: flex-end;
          gap: 0.4rem;
          height: 140px;
        }
        .trend-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .trend-bar-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
        }
        .trend-bar {
          width: 100%;
          background: var(--primary);
          border-radius: 4px 4px 0 0;
          min-height: 2px;
        }
        .trend-date {
          margin-top: 0.25rem;
          font-size: 0.65rem;
          color: var(--muted);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
