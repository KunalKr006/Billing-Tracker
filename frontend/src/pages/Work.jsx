import { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import Header from '../components/Header';
import WorkTable from '../components/WorkTable';
import WorkForm from '../components/WorkForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { workAPI, clientsAPI, categoriesAPI, MONTHS } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = ['completed', 'pending', 'cancelled'];

export default function Work({ sidebarOpen, setSidebarOpen }) {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    Promise.all([clientsAPI.list(), categoriesAPI.list()]).then(([c, cat]) => {
      setClients(c.data);
      setCategories(cat.data);
    });
  }, []);

  const fetchWork = () => {
    setLoading(true);
    const params = {};
    if (filterClient) params.client_id = filterClient;
    if (filterCategory) params.category_id = filterCategory;
    if (filterStatus) params.status = filterStatus;
    if (filterMonth) params.month = filterMonth;
    if (filterYear) params.year = filterYear;
    if (search) params.search = search;

    workAPI.list(params)
      .then(r => setEntries(r.data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWork(); }, [filterClient, filterCategory, filterStatus, filterMonth, filterYear]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchWork();
  };

  const handleAdd = async (data) => {
    await workAPI.create(data);
    toast('Work added successfully.');
    fetchWork();
  };

  const handleEdit = async (data) => {
    await workAPI.update(editEntry.id, data);
    toast('Work updated.');
    setEditEntry(null);
    fetchWork();
  };

  const handleDelete = async () => {
    await workAPI.delete(deleteEntry.id);
    toast('Work entry deleted.');
    setDeleteEntry(null);
    fetchWork();
  };

  const handleClearFilters = () => {
    setFilterClient('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterMonth('');
    setFilterYear('');
    setSearch('');
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const activeFilterCount = [filterClient, filterCategory, filterStatus, filterMonth, filterYear].filter(Boolean).length;

  return (
    <>
      <Header title="Work Entries" subtitle="All editing work records" onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="page-content">
        <div className="page-header work-page-header">
          <div>
            <h2>Work Entries</h2>
            <p>{entries.length} entries found</p>
          </div>
          <button className="btn btn-primary work-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            <span>Add Work</span>
          </button>
        </div>

        {/* Desktop Filters Bar */}
        <div className="filters-bar desktop-filters-only">
          <div className="search-input" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              placeholder="Search by title... (Enter)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              style={{ paddingLeft: 34 }}
              className="form-input"
            />
          </div>

          <select className="filter-select" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>

          <select className="filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>

          <select className="filter-select" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
            Clear
          </button>
        </div>

        {/* Mobile Filters Header Bar (Search + Filter Icon Button) */}
        <div className="mobile-filter-bar mobile-filters-only">
          <div className="search-input" style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              placeholder="Search title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              style={{ paddingLeft: 34 }}
              className="form-input"
            />
          </div>
          <button
            className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowMobileFilter(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}
          >
            <Filter size={16} />
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
                  Filter Work Entries
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

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
            <WorkTable
              entries={entries}
              onEdit={e => setEditEntry(e)}
              onDelete={e => setDeleteEntry(e)}
            />
          )}
        </div>

        <WorkForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAdd}
          clients={clients}
        />
        <WorkForm
          isOpen={!!editEntry}
          onClose={() => setEditEntry(null)}
          onSubmit={handleEdit}
          clients={clients}
          initialData={editEntry}
        />
        <ConfirmDialog
          isOpen={!!deleteEntry}
          title="Delete Work Entry"
          message={`Delete "${deleteEntry?.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteEntry(null)}
        />
      </div>
    </>
  );
}
