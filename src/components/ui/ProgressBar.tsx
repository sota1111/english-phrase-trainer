type ProgressBarProps = {
  current: number;
  total: number;
  showText?: boolean;
};

export function ProgressBar({ current, total, showText = true }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div style={{ width: '100%' }}>
      {showText && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
          <span>残り {total - current} 件 / 全 {total} 件</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div style={{ height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            background: '#0070f3', 
            width: `${progress}%`, 
            transition: 'width 0.3s ease' 
          }} 
        />
      </div>
    </div>
  );
}
