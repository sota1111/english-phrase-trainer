type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
};

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="card card-pad" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'var(--muted-2)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}
