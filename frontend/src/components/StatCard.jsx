import './StatCard.css';

export default function StatCard({ num, label, value, hint, accent = 'gold', big = false }) {
  return (
    <div className={`stat-card stat-${accent} ${big ? 'stat-big' : ''}`}>
      <div className="stat-top">
        <span className="stat-num">{num}</span>
        <span className="stat-dot" />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
