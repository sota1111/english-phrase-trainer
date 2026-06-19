import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container" style={{ textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden>🔍</div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>ページが見つかりません</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.75rem' }}>
          お探しのページは削除されたか、URLが間違っている可能性があります。
        </p>
        <Link href="/" className="btn btn-primary">
          ホームへ戻る
        </Link>
      </div>
    </main>
  );
}
