import Link from 'next/link';
import { Importance } from '@/types/phrase';
import { IMPORTANCE_VALUES } from '@/lib/importance';
import { T } from '@/i18n/T';

type Props = {
  /** Route the links point at (e.g. '/spaced-review'). */
  basePath: string;
  /** Currently active importance, or null for "all". */
  current: Importance | null;
};

/**
 * Importance selector for the review (出題) screens. Each option is a link that
 * sets `?importance=<level>`; selecting 「すべて」/「All」 clears the filter. Rendered
 * as a server component so the chosen level is read back from the URL on the server.
 * Labels are localized via <T> (a client boundary) so they react to the JP/EN toggle.
 */
export function ImportancePicker({ basePath, current }: Props) {
  const options: { key: string; value: Importance | null }[] = [
    { key: 'importance.all', value: null },
    ...IMPORTANCE_VALUES.map((value) => ({ key: `importance.${value}`, value })),
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <span style={{ alignSelf: 'center', color: '#374151', fontSize: '0.9rem' }}>
        <T k="importance.label" />
      </span>
      {options.map((opt) => {
        const active = opt.value === current;
        const href = opt.value ? `${basePath}?importance=${opt.value}` : basePath;
        return (
          <Link
            key={opt.key}
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
            <T k={opt.key} />
          </Link>
        );
      })}
    </div>
  );
}
