import { useState, useEffect } from 'react';
import { Plus, Copy, Check, Pencil, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import AdditionalBillForm from '../components/AdditionalBillForm';
import WorkForm from '../components/WorkForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { additionalBillsAPI, billingAPI, clientsAPI, formatINR, MONTHS, workAPI } from '../services/api';
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
  const [showAdditionalBillForm, setShowAdditionalBillForm] = useState(false);
  const [deleteAdditionalBill, setDeleteAdditionalBill] = useState(null);
  const [editAdditionalBill, setEditAdditionalBill] = useState(null);
  const [deleteWorkEntry, setDeleteWorkEntry] = useState(null);
  const [editWorkEntry, setEditWorkEntry] = useState(null);
  const [deleteBill, setDeleteBill] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
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

  const handleAddAdditionalBill = async (data) => {
    if (editAdditionalBill) {
      await additionalBillsAPI.update(editAdditionalBill.id, data);
      setEditAdditionalBill(null);
      toast('Additional bill updated.');
    } else {
      await additionalBillsAPI.create({ ...data, client_id: selectedClient });
      toast('Additional bill added.');
    }
    setShowAdditionalBillForm(false);
    fetchBilling();
  };

  const handleDeleteAdditionalBill = async () => {
    await additionalBillsAPI.delete(deleteAdditionalBill);
    setDeleteAdditionalBill(null);
    toast('Additional bill deleted.');
    fetchBilling();
  };

  const handleDeleteWorkEntry = async () => {
    await workAPI.delete(deleteWorkEntry);
    setDeleteWorkEntry(null);
    toast('Billed work deleted.');
    fetchBilling();
  };

  const handleEditWorkEntry = async (entryId) => {
    const response = await workAPI.get(entryId);
    setEditWorkEntry(response.data);
  };

  const handleUpdateWorkEntry = async (data) => {
    await workAPI.update(editWorkEntry.id, data);
    setEditWorkEntry(null);
    toast('Billed work updated.');
    fetchBilling();
  };

  const handleDeleteBill = async () => {
    await billingAPI.delete(selectedClient, year, month);
    setDeleteBill(false);
    toast('Monthly bill deleted.');
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
            <div className="custom-select-wrap">
              <button
                type="button"
                className="filter-select custom-select-trigger"
                onClick={() => setShowClientSelector(open => !open)}
                aria-haspopup="listbox"
                aria-expanded={showClientSelector}
              >
                {clients.find(client => client.id === selectedClient)?.name || 'Select client'}
              </button>
              {showClientSelector && (
                <div className="custom-select-menu" role="listbox">
                  {clients.map(client => (
                    <button
                      type="button"
                      className="custom-select-option"
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client.id);
                        setShowClientSelector(false);
                      }}
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleCopy} disabled={!billing}>
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Bill</>}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAdditionalBillForm(true)} disabled={!selectedClient}>
              <Plus size={15} /> Add Bills
            </button>
            <button className="btn btn-danger" onClick={() => setDeleteBill(true)} disabled={!selectedClient}>
              <Trash2 size={15} /> Delete Bill
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
              <div className="billing-title-row">
                <div className="billing-title">{billing.month_name} {billing.year}</div>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => setDeleteBill(true)}
                >
                  <Trash2 size={13} /> Delete Bill
                </button>
              </div>

              {billing.categories.map(cat => (
                <div key={cat.category_id} className="billing-category">
                  <div className="billing-cat-name">{cat.category_name}</div>
                  <ul className="billing-cat-list">
                    {cat.entries.map((title, i) => (
                      <li key={i}>
                        <span className="li-num">{i + 1}.</span>
                        {title}
                        <button
                          type="button"
                          className="btn btn-danger btn-xs btn-icon"
                          onClick={() => setDeleteWorkEntry(cat.entry_ids[i])}
                          aria-label={`Delete ${title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-xs btn-icon" onClick={() => handleEditWorkEntry(cat.entry_ids[i])} aria-label={`Edit ${title}`}>
                          <Pencil size={13} />
                        </button>
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

              {billing.additional_bills?.length > 0 && (
                <div className="billing-category">
                  <div className="billing-cat-name">Additional Costs</div>
                  <ul className="billing-cat-list">
                    {billing.additional_bills.map(bill => (
                      <li key={bill.id}>
                        <span className="li-num">+</span>
                        {bill.title}
                        <span style={{ marginLeft: 'auto' }}>{formatINR(bill.amount)}</span>
                        <button
                          type="button"
                          className="btn btn-danger btn-xs btn-icon"
                          onClick={() => setDeleteAdditionalBill(bill.id)}
                          aria-label={`Delete ${bill.title}`}
                        >
                          <Trash2 size={13} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-xs btn-icon" onClick={() => { setEditAdditionalBill(bill); setShowAdditionalBillForm(true); }} aria-label={`Edit ${bill.title}`}>
                          <Pencil size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
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

            <div className="card">
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
        )}
        <AdditionalBillForm
          isOpen={showAdditionalBillForm}
          onClose={() => { setShowAdditionalBillForm(false); setEditAdditionalBill(null); }}
          onSubmit={handleAddAdditionalBill}
          defaultDate={`${year}-${String(month).padStart(2, '0')}-01`}
          initial={editAdditionalBill}
        />
        <WorkForm
          isOpen={!!editWorkEntry}
          onClose={() => setEditWorkEntry(null)}
          onSubmit={handleUpdateWorkEntry}
          clients={clients}
          initialData={editWorkEntry}
        />
        <ConfirmDialog
          isOpen={!!deleteAdditionalBill}
          title="Delete Additional Bill"
          message="Are you sure you want to delete this additional bill?"
          onConfirm={handleDeleteAdditionalBill}
          onCancel={() => setDeleteAdditionalBill(null)}
        />
        <ConfirmDialog
          isOpen={!!deleteWorkEntry}
          title="Delete Billed Work"
          message="Are you sure you want to delete this work from the bill?"
          onConfirm={handleDeleteWorkEntry}
          onCancel={() => setDeleteWorkEntry(null)}
        />
        <ConfirmDialog
          isOpen={deleteBill}
          title="Delete Monthly Bill"
          message={`Delete all billed work and additional costs for ${MONTHS[month - 1]} ${year}?`}
          onConfirm={handleDeleteBill}
          onCancel={() => setDeleteBill(false)}
        />
      </div>
    </>
  );
}
