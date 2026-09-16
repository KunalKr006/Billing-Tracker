import { Pencil, Trash2 } from 'lucide-react';
import { formatINR } from '../services/api';

const STATUS_BADGE = {
  completed: 'badge-green',
  pending:   'badge-yellow',
  cancelled: 'badge-gray',
};

export default function WorkTable({ entries = [], onEdit, onDelete }) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3>No work entries found</h3>
        <p>Add your first entry with the "+ Add Work" button</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-wrapper desktop-table-only">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Client</th>
              <th>Category</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  {new Date(e.work_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td><strong>{e.title}</strong></td>
                <td style={{ color: 'var(--text-3)' }}>{e.client?.name || '—'}</td>
                <td>
                  <span className="badge badge-purple">{e.category?.name || '—'}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{formatINR(e.rate)}</td>
                <td>
                  <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`}>
                    {e.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs btn-icon" onClick={() => onEdit(e)} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-danger btn-xs btn-icon" onClick={() => onDelete(e)} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="mobile-cards-only">
        {entries.map(e => (
          <div key={e.id} className="mobile-entry-card">
            <div className="mobile-entry-header">
              <div>
                <div className="mobile-entry-title">{e.title}</div>
                <div className="mobile-entry-sub">
                  {new Date(e.work_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  {e.client?.name ? ` · ${e.client.name}` : ''}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`}>
                {e.status}
              </span>
            </div>
            <div className="mobile-entry-body">
              <span className="badge badge-purple">{e.category?.name || '—'}</span>
              <strong className="mobile-entry-rate">{formatINR(e.rate)}</strong>
            </div>
            <div className="mobile-entry-footer">
              <button className="btn btn-secondary btn-xs" onClick={() => onEdit(e)}>
                <Pencil size={12} /> Edit
              </button>
              <button className="btn btn-danger btn-xs" onClick={() => onDelete(e)}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
