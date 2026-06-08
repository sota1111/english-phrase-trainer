type StatsCardProps = {
  label: string;
  value: string | number;
  description?: string;
};

export function StatsCard({ label, value, description }: StatsCardProps) {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #eee'
    }}>
      <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{label}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{value}</div>
      {description && <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{description}</p>}
    </div>
  );
}
