import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { billingAPI, clientsAPI, formatINR } from '../services/api';
import CustomSelect from '../components/CustomSelect';

const STATUS_CONFIG = {
  paid:           { label: 'PAID',           cls: 'badge-green' },
  partially_paid: { label: 'PARTIALLY PAID', cls: 'badge-yellow' },
  unpaid:         { label: 'UNPAID',         cls: 'badge-red' },
};

export default function History({ setSidebarOpen }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    clientsAPI.list().then(r => {
      setClients(r.data);
      if (r.data.length > 0) setSelectedClient(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    billingAPI.history(selectedClient)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [selectedClient]);

  const goToBilling = (item) => {
    // Navigate to billing page — we pass state via URL or localStorage trick
    navigate('/billing', { state: { month: item.month, year: item.year, clientId: selectedClient } });
  };

  const handleDelete = async () => {
    await billingAPI.delete(selectedClient, deleteTarget.year, deleteTarget.month);
    setDeleteTarget(null);
    setLoading(true);
    billingAPI.history(selectedClient)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Header title="History" subtitle="Monthly billing history" onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h2>Billing History</h2>
            <p>All months with work or payments</p>
          </div>
          {clients.length > 1 && (
            <CustomSelect className="filter-select" value={selectedClient || ''} onChange={setSelectedClient} options={clients.map(client => ({ value: client.id, label: client.name }))} placeholder="Select client" ariaLabel="Client" />
          )}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <h3>No history yet</h3>
            <p>Add work entries to see monthly history here.</p>
          </div>
        ) : (
          <div className="history-grid">
            {history.map(item => {
              const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.unpaid;
              return (
                <div
                  key={`${item.year}-${item.month}`}
                  className="history-card"
                  onClick={() => goToBilling(item)}
                >
                  <div className="history-month">
                    <span>{item.month_name} {item.year}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${sc.cls}`}>{sc.label}</span>
                      <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                      <button
                        type="button"
                        className="btn btn-danger btn-xs btn-icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        aria-label={`Delete ${item.month_name} ${item.year} bill`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="history-stats">
                    <div className="history-stat">
                      <div className="hl">Total Work</div>
                      <div className="hv">{item.total_entries} videos</div>
                    </div>
                    <div className="history-stat">
                      <div className="hl">Bill</div>
                      <div className="hv">{formatINR(item.total_bill)}</div>
                    </div>
                    <div className="history-stat">
                      <div className="hl">Paid</div>
                      <div className="hv" style={{ color: 'var(--green)' }}>{formatINR(item.total_paid)}</div>
                    </div>
                    <div className="history-stat">
                      <div className="hl">{item.status === 'paid' ? 'Settled' : 'Remaining'}</div>
                      <div className="hv" style={{ color: item.status === 'paid' ? 'var(--green)' : 'var(--yellow)' }}>
                        {item.status === 'paid' ? '✓' : formatINR(item.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Monthly Bill"
          message={deleteTarget ? `Delete the ${deleteTarget.month_name} ${deleteTarget.year} bill?` : ''}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
}
