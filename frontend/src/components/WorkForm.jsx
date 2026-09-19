import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { categoriesAPI, formatINR } from '../services/api';
import CustomSelect from './CustomSelect';

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending',   label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function WorkForm({ isOpen, onClose, onSubmit, clients = [], initialData = null, defaultClientId = null }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    category_id: '',
    title: '',
    work_date: new Date().toISOString().split('T')[0],
    rate: '',
    notes: '',
    status: 'completed',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [autoRate, setAutoRate] = useState(null);

  useEffect(() => {
    categoriesAPI.list().then(r => setCategories(r.data.filter(c => c.is_active)));
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          client_id: initialData.client_id || '',
          category_id: initialData.category_id || '',
          title: initialData.title || '',
          work_date: initialData.work_date || new Date().toISOString().split('T')[0],
          rate: initialData.rate || '',
          notes: initialData.notes || '',
          status: initialData.status || 'completed',
        });
        setAutoRate(null);
      } else {
        setForm({
          client_id: defaultClientId || (clients[0]?.id ?? ''),
          category_id: '',
          title: '',
          work_date: new Date().toISOString().split('T')[0],
          rate: '',
          notes: '',
          status: 'completed',
        });
        setAutoRate(null);
      }
      setErrors({});
    }
  }, [isOpen, initialData, defaultClientId]);

  useEffect(() => {
    if (!isOpen || initialData || categories.length === 0 || form.category_id) return;
    const firstCategory = categories[0];
    setForm(f => ({ ...f, category_id: String(firstCategory.id), rate: firstCategory.default_rate ?? f.rate }));
    setAutoRate(firstCategory.default_rate ?? null);
  }, [categories, isOpen, initialData, form.category_id]);

  const handleCategoryChange = (catId) => {
    const cat = categories.find(c => String(c.id) === String(catId));
    setForm(f => ({ ...f, category_id: catId, rate: cat ? cat.default_rate : '' }));
    setAutoRate(cat ? cat.default_rate : null);
  };

  const validate = () => {
    const e = {};
    if (!form.client_id) e.client_id = 'Client is required';
    if (categories.length > 0 && !form.category_id) e.category_id = 'Category is required';
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.work_date) e.work_date = 'Date is required';
    if (form.rate === '' || form.rate === null) e.rate = 'Rate is required';
    else if (parseFloat(form.rate) < 0) e.rate = 'Rate must be >= 0';
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
        category_id: form.category_id,
        title: form.title.trim(),
        work_date: form.work_date,
        rate: parseFloat(form.rate),
        notes: form.notes || null,
        status: form.status,
      });
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to save work entry' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initialData ? 'Edit Work Entry' : 'Add Work Entry'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && (
              <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.85rem' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="work-client" className="form-label">Client *</label>
                <CustomSelect value={form.client_id} onChange={value => setForm(f => ({ ...f, client_id: value }))} options={clients.map(client => ({ value: client.id, label: client.name }))} placeholder="Select client" ariaLabel="Client" />
                {errors.client_id && <div className="form-error">{errors.client_id}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="work-category" className="form-label">Category *</label>
                <CustomSelect value={form.category_id} onChange={handleCategoryChange} options={categories.map(category => ({ value: category.id, label: category.name }))} placeholder="Select category" ariaLabel="Category" />
                {errors.category_id && <div className="form-error">{errors.category_id}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="work-title" className="form-label">Title / Brand Name *</label>
              <input
                id="work-title"
                type="text"
                className="form-input"
                placeholder="e.g. Rima's Kitchen"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                aria-label="Title"
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="work-date" className="form-label">Work Date *</label>
                <input
                  id="work-date"
                  type="date"
                  className="form-input"
                  value={form.work_date}
                  onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))}
                />
                {errors.work_date && <div className="form-error">{errors.work_date}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="work-rate" className="form-label">Rate (₹) *</label>
                <input
                  id="work-rate"
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.rate}
                  onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                />
                {autoRate !== null && (
                  <div className="form-hint">Auto-filled: ₹{autoRate} (override if needed)</div>
                )}
                {errors.rate && <div className="form-error">{errors.rate}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="work-status" className="form-label">Status</label>
              <CustomSelect value={form.status} onChange={value => setForm(f => ({ ...f, status: value }))} options={STATUS_OPTIONS} ariaLabel="Status" />
            </div>

            <div className="form-group">
              <label htmlFor="work-notes" className="form-label">Notes</label>
              <textarea
                id="work-notes"
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
              {loading ? 'Saving...' : initialData ? 'Update Entry' : 'Save Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
