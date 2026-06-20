import Link from 'next/link';
import { Importance } from '@/types/phrase';
import { IMPORTANCE_VALUES, IMPORTANCE_LABEL } from '@/lib/importance';

type Props = {
  /** Route the links point at (e.g. '/spaced-review'). */
  basePath: string;
  /** Currently active importance, or null for "all". */
  current: Importance | null;
};

/**
 * Importance selector for the review (出題) screens. Each option is a link that
 * sets `?importance=<level>`; selecting 「すべて」 clears the filter. Rendered as a
 * server component so the chosen level is read back from the URL on the server.
 */
export function ImportancePicker({ basePath, current }: Props) {
  const options: { label: string; value: Importance | null }[] = [
    { label: 'すべて', value: null },
    ...IMPORTANCE_VALUES.map((value) => ({ label: IMPORTANCE_LABEL[value], value })),
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <span style={{ alignSelf: 'center', color: '#374151', fontSize: '0.9rem' }}>重要度:</span>
      {options.map((opt) => {
        const active = opt.value === current;
        const href = opt.value ? `${basePath}?importance=${opt.value}` : basePath;
        return (
          <Link
            key={opt.label}
            href={href}
            style={{
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              textDecoration: 'none',
              border: '1px solid #d1d5db',
              background: active ? '#0070f3' : '#fff',
              color: active ? '#fff' : '#374151',
            }}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
