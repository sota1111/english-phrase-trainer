'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth).catch(() => {});
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
