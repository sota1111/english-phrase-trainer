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
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif' }}>
        <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>重大なエラーが発生しました</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            アプリケーションの読み込み中に問題が発生しました。
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0070f3',
              color: '#fff',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
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
