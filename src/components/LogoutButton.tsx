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
      style={{ padding: '0.4rem 1rem', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
    >
      ログアウト
    </button>
  );
}
