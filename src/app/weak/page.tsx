import Link from 'next/link';

type SerializedPhrase = {
  id: string;
  phrase: string;
  meaningJa: string;
  category: string;
  difficulty: string;
  answeredCount: number;
  accuracy: number;
};

export default async function WeakPhrasesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let weakPhrases: SerializedPhrase[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/phrases`, { cache: 'no-store' });
    if (res.ok) {
      const phrases: SerializedPhrase[] = await res.json();
      weakPhrases = phrases
        .filter(p => p.answeredCount > 0 && p.accuracy < 0.5)
        .sort((a, b) => a.accuracy - b.accuracy);
    }
  } catch { /* Firestore unavailable at build time */ }

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>苦手フレーズ一覧</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {weakPhrases.length > 0 && (
            <Link
              href="/review/session?mode=weak&limit=20"
              style={{ padding: '0.5rem 1rem', background: '#0070f3', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}
            >
              苦手フレーズを復習
            </Link>
          )}
          <Link href="/" style={{ padding: '0.5rem 1rem', background: '#f0f0f0', color: '#333', borderRadius: '6px', textDecoration: 'none' }}>
            トップへ
          </Link>
        </div>
      </div>

      {weakPhrases.length === 0 ? (
        <p>苦手フレーズはありません。</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>フレーズ</th>
              <th style={{ padding: '0.5rem' }}>意味</th>
              <th style={{ padding: '0.5rem' }}>カテゴリ</th>
              <th style={{ padding: '0.5rem' }}>難易度</th>
              <th style={{ padding: '0.5rem' }}>正答率</th>
              <th style={{ padding: '0.5rem' }}>回答回数</th>
            </tr>
          </thead>
          <tbody>
            {weakPhrases.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{p.phrase}</td>
                <td style={{ padding: '0.5rem' }}>{p.meaningJa}</td>
                <td style={{ padding: '0.5rem' }}>{p.category}</td>
                <td style={{ padding: '0.5rem' }}>
                  {p.difficulty === 'easy' ? '易' : p.difficulty === 'normal' ? '普' : '難'}
                </td>
                <td style={{ padding: '0.5rem' }}>{Math.round(p.accuracy * 100)}%</td>
                <td style={{ padding: '0.5rem' }}>{p.answeredCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
