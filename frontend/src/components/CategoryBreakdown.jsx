import { formatINR } from '../services/api';

export default function CategoryBreakdown({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <div className="breakdown-section">
      <div className="section-title">Category Breakdown</div>
      <div className="breakdown-grid">
        {categories.map(cat => (
          <div key={cat.category_id} className="breakdown-card">
            <div className="breakdown-header">
              <div className="breakdown-name">{cat.category_name}</div>
              <div className="breakdown-subtotal">{formatINR(cat.subtotal)}</div>
            </div>
            <div className="breakdown-meta">
              {cat.count} {cat.count === 1 ? 'video' : 'videos'} × {formatINR(cat.rate_per_item)}
            </div>
            <ul className="breakdown-list">
              {cat.entries.map((title, i) => (
                <li key={i}>{title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
