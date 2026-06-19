'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f6f8', color: '#1a2230' }}>
        <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }} aria-hidden>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>重大なエラーが発生しました</h2>
          <p style={{ color: '#5b6472', marginBottom: '1.75rem' }}>
            アプリケーションの読み込み中に問題が発生しました。
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.7rem 1.4rem',
              background: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
        </main>
      </body>
    </html>
  );
}
