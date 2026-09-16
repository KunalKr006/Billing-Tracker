import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { clientsAPI, categoriesAPI, formatINR } from '../services/api';
import { useToast } from '../components/Toast';

// ── Client Form Modal ──────────────────────────────────────────────────────────
function ClientModal({ isOpen, onClose, onSubmit, initial = null }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', is_active: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { name: initial.name, email: initial.email || '', phone: initial.phone || '', notes: initial.notes || '', is_active: initial.is_active } : { name: '', email: '', phone: '', notes: '', is_active: true });
      setErrors({});
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setLoading(true);
    try {
      await onSubmit({ ...form, name: form.name.trim() });
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to save' });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Client' : 'Add Client'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.85rem' }}>{errors.submit}</div>}
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="client-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="client-active" style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Active client</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : initial ? 'Update' : 'Add Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Category Form Modal ────────────────────────────────────────────────────────
function CategoryModal({ isOpen, onClose, onSubmit, initial = null }) {
  const [form, setForm] = useState({ name: '', default_rate: '', description: '', is_active: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ? { name: initial.name, default_rate: initial.default_rate, description: initial.description || '', is_active: initial.is_active } : { name: '', default_rate: '', description: '', is_active: true });
      setErrors({});
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.default_rate === '' || parseFloat(form.default_rate) < 0) errs.default_rate = 'Rate must be >= 0';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit({ ...form, name: form.name.trim(), default_rate: parseFloat(form.default_rate) });
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Failed to save' });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Edit Category' : 'Add Category'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.85rem' }}>{errors.submit}</div>}
            {initial && (
              <div style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', padding: '10px 14px', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.8rem' }}>
                ⚠️ Changing the rate only affects <strong>future</strong> work entries. Historical entries keep their original rate.
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Video" />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Default Rate (₹) *</label>
                <input type="number" className="form-input" min="0" step="0.01" value={form.default_rate} onChange={e => setForm(f => ({ ...f, default_rate: e.target.value }))} placeholder="250" />
                {errors.default_rate && <div className="form-error">{errors.default_rate}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="cat-active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="cat-active" style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Active category</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : initial ? 'Update' : 'Add Category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
export default function Settings({ setSidebarOpen }) {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clientModal, setClientModal] = useState({ open: false, item: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, item }

  const fetchAll = () => {
    clientsAPI.list().then(r => setClients(r.data));
    categoriesAPI.list().then(r => setCategories(r.data));
  };

  useEffect(() => { fetchAll(); }, []);

  // Clients
  const handleAddClient = async (data) => { await clientsAPI.create(data); toast('Client added.'); fetchAll(); };
  const handleEditClient = async (data) => { await clientsAPI.update(clientModal.item.id, data); toast('Client updated.'); fetchAll(); };
  const handleDeleteClient = async () => { await clientsAPI.delete(deleteTarget.item.id); toast('Client deleted.'); setDeleteTarget(null); fetchAll(); };

  // Categories
  const handleAddCategory = async (data) => { await categoriesAPI.create(data); toast('Category added.'); fetchAll(); };
  const handleEditCategory = async (data) => { await categoriesAPI.update(categoryModal.item.id, data); toast('Category updated.'); fetchAll(); };
  const handleDeleteCategory = async () => { await categoriesAPI.delete(deleteTarget.item.id); toast('Category deleted.'); setDeleteTarget(null); fetchAll(); };

  return (
    <>
      <Header title="Settings" subtitle="Manage clients, categories, and rates" onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="page-content">

        {/* Clients Section */}
        <div className="settings-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Clients</div>
              <button className="btn btn-primary btn-sm" onClick={() => setClientModal({ open: true, item: null })}>
                <Plus size={14} /> Add Client
              </button>
            </div>
            {clients.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No clients yet. Add your first client.</p>
              </div>
            ) : (
              clients.map(c => (
                <div key={c.id} className="settings-row">
                  <div className="settings-row-info">
                    <div className="settings-row-name">
                      {c.name}
                      {!c.is_active && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Inactive</span>}
                    </div>
                    <div className="settings-row-sub">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info'}
                    </div>
                  </div>
                  <div className="settings-row-actions">
                    <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setClientModal({ open: true, item: c })}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-xs btn-icon" onClick={() => setDeleteTarget({ type: 'client', item: c })}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="settings-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Categories & Rates</div>
              <button className="btn btn-primary btn-sm" onClick={() => setCategoryModal({ open: true, item: null })}>
                <Plus size={14} /> Add Category
              </button>
            </div>
            <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
              Changing a default rate only affects <strong style={{ color: 'var(--text-2)' }}>future work entries</strong>. Historical entries always keep their original rate.
            </div>
            {categories.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No categories yet. Add your first category.</p>
              </div>
            ) : (
              categories.map(c => (
                <div key={c.id} className="settings-row">
                  <div className="settings-row-info">
                    <div className="settings-row-name">
                      {c.name}
                      {!c.is_active && <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Inactive</span>}
                    </div>
                    <div className="settings-row-sub">{c.description || 'No description'}</div>
                  </div>
                  <div className="settings-row-actions">
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.95rem', marginRight: 8 }}>
                      {formatINR(c.default_rate)}
                    </span>
                    <button className="btn btn-ghost btn-xs btn-icon" onClick={() => setCategoryModal({ open: true, item: c })}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-xs btn-icon" onClick={() => setDeleteTarget({ type: 'category', item: c })}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ClientModal
          isOpen={clientModal.open}
          onClose={() => setClientModal({ open: false, item: null })}
          onSubmit={clientModal.item ? handleEditClient : handleAddClient}
          initial={clientModal.item}
        />
        <CategoryModal
          isOpen={categoryModal.open}
          onClose={() => setCategoryModal({ open: false, item: null })}
          onSubmit={categoryModal.item ? handleEditCategory : handleAddCategory}
          initial={categoryModal.item}
        />
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title={`Delete ${deleteTarget?.type === 'client' ? 'Client' : 'Category'}`}
          message={`Are you sure you want to delete "${deleteTarget?.item?.name}"? This action cannot be undone.`}
          onConfirm={deleteTarget?.type === 'client' ? handleDeleteClient : handleDeleteCategory}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </>
  );
}
