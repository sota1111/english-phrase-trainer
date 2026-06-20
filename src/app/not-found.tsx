import Link from 'next/link';
import { T } from '@/i18n/T';

export default function NotFound() {
  return (
    <main className="container" style={{ textAlign: 'center' }}>
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden>🔍</div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}><T k="notfound.title" /></h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.75rem' }}>
          <T k="notfound.body" />
        </p>
        <Link href="/" className="btn btn-primary">
          <T k="common.home" />
        </Link>
      </div>
    </main>
  );
}
