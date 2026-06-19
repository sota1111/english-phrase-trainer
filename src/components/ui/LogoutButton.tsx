'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost"
      style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
    >
      ログアウト
    </button>
  );
}
