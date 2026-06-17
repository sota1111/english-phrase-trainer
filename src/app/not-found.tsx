import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ページが見つかりません</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          background: '#0070f3',
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        ホームへ戻る
      </Link>
    </main>
  );
}
