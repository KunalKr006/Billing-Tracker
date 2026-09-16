import { useState, useEffect } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import Header from '../components/Header';
import PaymentForm from '../components/PaymentForm';
import PaymentHistory from '../components/PaymentHistory';
import ConfirmDialog from '../components/ConfirmDialog';
import { paymentsAPI, clientsAPI, formatINR, MONTHS } from '../services/api';
import { useToast } from '../components/Toast';

export default function Payments({ sidebarOpen, setSidebarOpen }) {
  const toast = useToast();
  const now = new Date();
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [deletePayment, setDeletePayment] = useState(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    clientsAPI.list().then(r => setClients(r.data));
  }, []);

  const fetchPayments = () => {
    setLoading(true);
    const params = {};
    if (filterClient) params.client_id = filterClient;
    if (filterMonth) params.month = filterMonth;
    if (filterYear) params.year = filterYear;
    paymentsAPI.list(params)
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [filterClient, filterMonth, filterYear]);

  const handleAdd = async (data) => {
    await paymentsAPI.create(data);
    toast('Payment recorded.');
    fetchPayments();
  };

  const handleDelete = async () => {
    await paymentsAPI.delete(deletePayment);
    toast('Payment deleted.');
    setDeletePayment(null);
    fetchPayments();
  };

  const handleClearFilters = () => {
    setFilterClient('');
    setFilterMonth('');
    setFilterYear('');
  };

  const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const activeFilterCount = [filterClient, filterMonth, filterYear].filter(Boolean).length;

  return (
    <>
      <Header title="Payments" subtitle="All recorded payments" onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="page-content">
        <div className="page-header payments-page-header">
          <div>
            <h2>Payments</h2>
            <p>{payments.length} records · {formatINR(total)} total</p>
          </div>
          <button className="btn btn-primary payments-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Desktop Filters Bar */}
        <div className="filters-bar desktop-filters-only">
          <select className="filter-select" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>Clear</button>
        </div>

        {/* Mobile Filters Bar */}
        <div className="mobile-filter-bar mobile-filters-only" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowMobileFilter(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Filter size={16} />
            <span>Filter Payments</span>
            {activeFilterCount > 0 && (
              <span className="badge badge-purple" style={{ background: '#fff', color: 'var(--primary)', padding: '1px 6px', fontSize: '0.7rem' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <div className="modal-overlay" onClick={() => setShowMobileFilter(false)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={18} style={{ color: 'var(--primary-light)' }} />
                  Filter Payments
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowMobileFilter(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select className="form-select" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                    <option value="">All Clients</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="">All Months</option>
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                      <option value="">All Years</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { handleClearFilters(); setShowMobileFilter(false); }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowMobileFilter(false)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /> Loading...</div>
          ) : (
            <PaymentHistory payments={payments} onDelete={id => setDeletePayment(id)} />
          )}
        </div>

        <PaymentForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAdd}
          clients={clients}
        />
        <ConfirmDialog
          isOpen={!!deletePayment}
          title="Delete Payment"
          message="Are you sure you want to delete this payment? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeletePayment(null)}
        />
      </div>
    </>
  );
}
