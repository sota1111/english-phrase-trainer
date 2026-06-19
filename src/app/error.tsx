'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container" style={{ textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden>⚠️</div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>予期せぬエラーが発生しました</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.75rem' }}>
          申し訳ありません。問題が発生しました。もう一度お試しいただくか、ホームに戻ってください。
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => reset()} className="btn btn-primary">
            再試行
          </button>
          <Link href="/" className="btn btn-ghost">
            ホームへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
