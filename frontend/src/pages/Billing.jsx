import { useState, useEffect } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import Header from '../components/Header';
import PaymentForm from '../components/PaymentForm';
import PaymentHistory from '../components/PaymentHistory';
import ConfirmDialog from '../components/ConfirmDialog';
import { billingAPI, clientsAPI, paymentsAPI, formatINR, MONTHS } from '../services/api';
import { useToast } from '../components/Toast';

export default function Billing({ sidebarOpen, setSidebarOpen }) {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [deletePayment, setDeletePayment] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clientsAPI.list().then(r => {
      setClients(r.data);
      if (r.data.length > 0) setSelectedClient(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    fetchBilling();
  }, [selectedClient, year, month]);

  const fetchBilling = () => {
    setLoading(true);
    billingAPI.get(selectedClient, year, month)
      .then(r => setBilling(r.data))
      .catch(() => setBilling(null))
      .finally(() => setLoading(false));
  };

  const handleAddPayment = async (data) => {
    await paymentsAPI.create(data);
    toast('Payment recorded.');
    fetchBilling();
  };

  const handleDeletePayment = async () => {
    await paymentsAPI.delete(deletePayment);
    toast('Payment deleted.');
    setDeletePayment(null);
    fetchBilling();
  };

  const generateBillText = () => {
    if (!billing) return '';
    const lines = [];
    lines.push(`${billing.month_name} Bill`);
    lines.push('');

    billing.categories.forEach(cat => {
      lines.push(cat.category_name);
      lines.push('');
      cat.entries.forEach((title, i) => {
        lines.push(`${i + 1}. ${title}`);
      });
      lines.push('');
      lines.push(`${cat.count} × ₹${Number(cat.rate_per_item).toLocaleString('en-IN')} = ₹${Number(cat.subtotal).toLocaleString('en-IN')}`);
      lines.push('');
    });

    lines.push(`Total Bill: ₹${Number(billing.total_bill).toLocaleString('en-IN')}`);
    lines.push(`Paid: ₹${Number(billing.total_paid).toLocaleString('en-IN')}`);
    if (billing.is_overpaid) {
      lines.push(`Overpaid by: ₹${Number(billing.balance).toLocaleString('en-IN')}`);
    } else {
      lines.push(`Remaining: ₹${Number(billing.balance).toLocaleString('en-IN')}`);
    }

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = generateBillText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Bill copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  return (
    <>
      <Header
        title="Billing"
        subtitle="Monthly bill calculation"
        onMenuToggle={() => setSidebarOpen(o => !o)}
        showMonthSelector
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />
      <div className="page-content">
        {/* Controls */}
        <div className="page-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={selectedClient || ''}
              onChange={e => setSelectedClient(Number(e.target.value))}
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleCopy} disabled={!billing}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Bill</>}
            </button>
            <button className="btn btn-primary" onClick={() => setShowPaymentForm(true)}>
              <Plus size={15} /> Add Payment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading billing...</div>
        ) : !billing ? (
          <div className="card">
            <div className="empty-state">
              <h3>No billing data</h3>
              <p>No completed work entries for {MONTHS[month - 1]} {year}</p>
            </div>
          </div>
        ) : (
          <div className="billing-grid">
            {/* Bill */}
            <div className="billing-summary">
              <div className="billing-title">{billing.month_name} {billing.year}</div>

              {billing.categories.map(cat => (
                <div key={cat.category_id} className="billing-category">
                  <div className="billing-cat-name">{cat.category_name}</div>
                  <ul className="billing-cat-list">
                    {cat.entries.map((title, i) => (
                      <li key={i}>
                        <span className="li-num">{i + 1}.</span>
                        {title}
                      </li>
                    ))}
                  </ul>
                  <div className="billing-cat-total">
                    <span>{cat.count} × {formatINR(cat.rate_per_item)}</span>
                    <span>{formatINR(cat.subtotal)}</span>
                  </div>
                </div>
              ))}

              {billing.categories.length === 0 && (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <p>No completed work entries this month.</p>
                </div>
              )}

              <div className="billing-totals">
                <div className="billing-row total">
                  <span className="label">Total Bill</span>
                  <span className="value">{formatINR(billing.total_bill)}</span>
                </div>
                <div className="billing-row paid">
                  <span className="label">Total Paid</span>
                  <span className="value">{formatINR(billing.total_paid)}</span>
                </div>
                <div className={`billing-row ${billing.is_overpaid ? 'overpaid' : 'balance'}`}>
                  <span className="label">{billing.is_overpaid ? 'Overpaid by' : 'Balance'}</span>
                  <span className="value">{formatINR(billing.balance)}</span>
                </div>
              </div>
            </div>

            {/* Payment panel */}
            <div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Payments</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentForm(true)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
                <PaymentHistory
                  payments={billing.payments}
                  onDelete={id => setDeletePayment(id)}
                />
              </div>

              {/* Summary box */}
              <div className="card" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Total entries</span>
                    <span style={{ fontWeight: 700 }}>{billing.total_entries}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Bill amount</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{formatINR(billing.total_bill)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Paid</span>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>{formatINR(billing.total_paid)}</span>
                  </div>
                  <hr className="divider" style={{ margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                      {billing.is_overpaid ? 'Overpaid' : 'Remaining'}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: billing.is_overpaid ? 'var(--green)' : 'var(--yellow)' }}>
                      {formatINR(billing.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <PaymentForm
          isOpen={showPaymentForm}
          onClose={() => setShowPaymentForm(false)}
          onSubmit={handleAddPayment}
          clients={clients}
          defaultClientId={selectedClient}
          defaultMonth={month}
          defaultYear={year}
        />
        <ConfirmDialog
          isOpen={!!deletePayment}
          title="Delete Payment"
          message="Are you sure you want to delete this payment record?"
          onConfirm={handleDeletePayment}
          onCancel={() => setDeletePayment(null)}
        />
      </div>
    </>
  );
}
