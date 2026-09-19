import { useEffect, useState } from 'react';

export default function AdditionalBillForm({ isOpen, onClose, onSubmit, defaultDate, initial = null }) {
  const defaultMonth = defaultDate?.slice(0, 7) || '';
  const [form, setForm] = useState({ title: '', amount: '', bill_month: defaultMonth, notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { title: initial.title, amount: initial.amount, bill_month: initial.bill_date.slice(0, 7), notes: initial.notes || '' } : { title: '', amount: '', bill_month: defaultMonth, notes: '' });
      setError('');
    }
  }, [isOpen, defaultDate, initial]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) { setError('Description is required'); return; }
    if (form.amount === '' || Number(form.amount) < 0) { setError('Amount must be 0 or more'); return; }
    if (!form.bill_month) { setError('Month is required'); return; }
    setLoading(true);
    try {
      await onSubmit({ title: form.title.trim(), amount: Number(form.amount), bill_date: `${form.bill_month}-01`, notes: form.notes });
      onClose();
    } catch (submitError) {
      setError(submitError.response?.data?.detail || 'Failed to add bill');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Additional Bill' : 'Add Additional Bill'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>X</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="additional-bill-title">Description *</label>
              <input id="additional-bill-title" className="form-input" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Travel, props, delivery..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="additional-bill-amount">Amount *</label>
                <input id="additional-bill-amount" type="number" min="0" step="0.01" className="form-input" value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="additional-bill-month">Billing Month *</label>
                <input id="additional-bill-month" type="month" className="form-input" value={form.bill_month} onChange={event => setForm(current => ({ ...current, bill_month: event.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="additional-bill-notes">Notes</label>
              <textarea id="additional-bill-notes" className="form-textarea" value={form.notes} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : initial ? 'Update Bill' : 'Add Bill'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
