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
    <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>予期せぬエラーが発生しました</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        申し訳ありません。問題が発生しました。もう一度お試しいただくか、ホームに戻ってください。
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f0f0f0',
            color: '#333',
            borderRadius: '6px',
            textDecoration: 'none',
          }}
        >
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
