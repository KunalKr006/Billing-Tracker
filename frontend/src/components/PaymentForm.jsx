import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MONTHS } from '../services/api';

const PAYMENT_METHODS = [
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',          label: 'Cash' },
  { value: 'other',         label: 'Other' },
];

export default function PaymentForm({ isOpen, onClose, onSubmit, clients = [], defaultClientId = null, defaultMonth = null, defaultYear = null }) {
  const now = new Date();
  const [form, setForm] = useState({
    client_id: '',
    amount: '',
    payment_date: now.toISOString().split('T')[0],
    for_month: defaultMonth || now.getMonth() + 1,
    for_year: defaultYear || now.getFullYear(),
    payment_method: 'upi',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cur = new Date();
      setForm({
        client_id: defaultClientId || (clients[0]?.id ?? ''),
        amount: '',
        payment_date: cur.toISOString().split('T')[0],
        for_month: defaultMonth || cur.getMonth() + 1,
        for_year: defaultYear || cur.getFullYear(),
        payment_method: 'upi',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen, defaultClientId, defaultMonth, defaultYear]);

  const validate = () => {
    const e = {};
    if (!form.client_id) e.client_id = 'Client is required';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
    if (!form.payment_date) e.payment_date = 'Payment date is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit({
        client_id: Number(form.client_id),
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        for_month: Number(form.for_month),
        for_year: Number(form.for_year),
        payment_method: form.payment_method,
        notes: form.notes || null,
      });
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to record payment' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Record Payment</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && (
              <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.85rem' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="payment-client" className="form-label">Client *</label>
              <select
                id="payment-client"
                className="form-select"
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              >
                <option value="">Select client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.client_id && <div className="form-error">{errors.client_id}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payment-amount" className="form-label">Amount (₹) *</label>
                <input
                  id="payment-amount"
                  type="number"
                  className="form-input"
                  min="1"
                  step="0.01"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="payment-date" className="form-label">Payment Date *</label>
                <input
                  id="payment-date"
                  type="date"
                  className="form-input"
                  value={form.payment_date}
                  onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                />
                {errors.payment_date && <div className="form-error">{errors.payment_date}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payment For Month *</label>
                <select
                  className="form-select"
                  value={form.for_month}
                  onChange={e => setForm(f => ({ ...f, for_month: e.target.value }))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Payment For Year *</label>
                <select
                  className="form-select"
                  value={form.for_year}
                  onChange={e => setForm(f => ({ ...f, for_year: e.target.value }))}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              >
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Recording...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
