type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
};

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#111' }}>{value}</div>
      <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}
