import { Trash2 } from 'lucide-react';
import { formatINR, MONTHS } from '../services/api';

const METHOD_LABELS = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  other: 'Other',
};

export default function PaymentHistory({ payments = [], onDelete }) {
  if (!payments.length) {
    return (
      <div className="empty-state" style={{ padding: '30px 0' }}>
        <p>No payments recorded yet.</p>
      </div>
    );
  }

  const getForMonthLabel = (p) => {
    if (p.for_month && p.for_year) {
      return `${MONTHS[p.for_month - 1]} ${p.for_year}`;
    }
    const d = new Date(p.payment_date + 'T00:00:00');
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-wrapper desktop-table-only">
        <table>
          <thead>
            <tr>
              <th>Date Paid</th>
              <th>For Month</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Notes</th>
              {onDelete && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.payment_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td><span className="badge badge-gray">{getForMonthLabel(p)}</span></td>
                <td><strong style={{ color: 'var(--green)' }}>{formatINR(p.amount)}</strong></td>
                <td><span className="badge badge-blue">{METHOD_LABELS[p.payment_method] || p.payment_method}</span></td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{p.notes || '—'}</td>
                {onDelete && (
                  <td>
                    <button className="btn btn-danger btn-xs btn-icon" onClick={() => onDelete(p.id)} title="Delete payment">
                      <Trash2 size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-cards-only">
        {payments.map(p => (
          <div key={p.id} className="mobile-entry-card">
            <div className="mobile-entry-header">
              <div>
                <strong style={{ color: 'var(--green)', fontSize: '1rem' }}>{formatINR(p.amount)}</strong>
                <div className="mobile-entry-sub">
                  Paid {new Date(p.payment_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <span className="badge badge-blue">{METHOD_LABELS[p.payment_method] || p.payment_method}</span>
            </div>
            <div className="mobile-entry-body">
              <span className="badge badge-gray">For: {getForMonthLabel(p)}</span>
              {p.notes && <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{p.notes}</span>}
            </div>
            {onDelete && (
              <div className="mobile-entry-footer" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-danger btn-xs" onClick={() => onDelete(p.id)}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
