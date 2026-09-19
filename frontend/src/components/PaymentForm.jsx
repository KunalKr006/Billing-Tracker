import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CustomSelect from './CustomSelect';

const PAYMENT_METHODS = [
  { value: 'upi',           label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash',          label: 'Cash' },
  { value: 'other',         label: 'Other' },
];

export default function PaymentForm({ isOpen, onClose, onSubmit, clients = [], defaultClientId = null, defaultMonth = null, defaultYear = null, initial = null }) {
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
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cur = new Date();
      setForm(initial ? {
        client_id: initial.client_id,
        amount: initial.amount,
        payment_date: initial.payment_date,
        for_month: initial.for_month || cur.getMonth() + 1,
        for_year: initial.for_year || cur.getFullYear(),
        payment_method: initial.payment_method || 'upi',
        notes: initial.notes || '',
      } : {
        client_id: defaultClientId || (clients[0]?.id ?? ''), amount: '', payment_date: cur.toISOString().split('T')[0],
        for_month: defaultMonth || cur.getMonth() + 1, for_year: defaultYear || cur.getFullYear(), payment_method: 'upi', notes: '',
      });
      setErrors({});
      setShowPaymentMethods(false);
    }
  }, [isOpen, defaultClientId, defaultMonth, defaultYear, initial]);

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
        client_id: form.client_id,
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
          <div className="modal-title">{initial ? 'Edit Payment' : 'Record Payment'}</div>
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
              <CustomSelect value={form.client_id} onChange={value => setForm(f => ({ ...f, client_id: value }))} options={clients.map(client => ({ value: client.id, label: client.name }))} placeholder="Select client" ariaLabel="Client" />
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

            <div className="form-group">
              <label className="form-label" htmlFor="payment-period">Payment For Month *</label>
              <input
                id="payment-period"
                type="month"
                className="form-input"
                value={`${form.for_year}-${String(form.for_month).padStart(2, '0')}`}
                onChange={e => {
                  const [year, month] = e.target.value.split('-');
                  setForm(f => ({ ...f, for_year: year, for_month: month }));
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div className="custom-select-wrap">
                <button
                  type="button"
                  className="form-select custom-select-trigger"
                  onClick={() => setShowPaymentMethods(open => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={showPaymentMethods}
                >
                  {PAYMENT_METHODS.find(method => method.value === form.payment_method)?.label}
                </button>
                {showPaymentMethods && (
                  <div className="custom-select-menu" role="listbox">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        type="button"
                        className="custom-select-option"
                        key={method.value}
                        onClick={() => {
                          setForm(current => ({ ...current, payment_method: method.value }));
                          setShowPaymentMethods(false);
                        }}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              {loading ? 'Saving...' : initial ? 'Update Payment' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
