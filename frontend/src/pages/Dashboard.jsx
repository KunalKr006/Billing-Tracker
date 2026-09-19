import { useState, useEffect } from 'react';
import { Video, IndianRupee, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import CategoryBreakdown from '../components/CategoryBreakdown';
import WorkTable from '../components/WorkTable';
import WorkForm from '../components/WorkForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { dashboardAPI, clientsAPI, workAPI, formatINR } from '../services/api';
import { useToast } from '../components/Toast';

export default function Dashboard({ sidebarOpen, setSidebarOpen }) {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientsAPI.list().then(r => {
      setClients(r.data);
      if (r.data.length > 0 && !selectedClient) setSelectedClient(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    dashboardAPI.get(selectedClient, year, month)
      .then(r => setDashboard(r.data))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [selectedClient, year, month]);

  const handleAddWork = async (data) => {
    await workAPI.create(data);
    toast('Work added successfully.');
    refreshDashboard();
  };

  const handleEditWork = async (data) => {
    await workAPI.update(editEntry.id, data);
    toast('Work updated.');
    setEditEntry(null);
    refreshDashboard();
  };

  const handleDeleteWork = async () => {
    await workAPI.delete(deleteEntry.id);
    toast('Work entry deleted.');
    setDeleteEntry(null);
    refreshDashboard();
  };

  const refreshDashboard = () => {
    if (!selectedClient) return;
    dashboardAPI.get(selectedClient, year, month)
      .then(r => setDashboard(r.data))
      .catch(() => setDashboard(null));
  };

  const recentWork = dashboard?.recent_work?.map(w => ({
    ...w,
    client: clients.find(c => c.id === selectedClient),
    category: { name: w.category_name },
    work_date: w.work_date,
  })) || [];

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={dashboard ? `${dashboard.month_name} ${dashboard.year}` : ''}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        showMonthSelector
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
      />
      <div className="page-content">
        {/* Client selector */}
        {clients.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <select
              className="filter-select"
              value={selectedClient || ''}
              onChange={e => setSelectedClient(Number(e.target.value))}
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading dashboard...</div>
        ) : !dashboard ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No data available</h3>
            <p>Add work entries to see your dashboard.</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard
                icon={Video}
                label="Total Videos"
                value={dashboard.total_videos}
                sub="Completed this month"
                colorClass="purple"
              />
              <StatCard
                icon={IndianRupee}
                label="Total Bill"
                value={formatINR(dashboard.total_bill)}
                colorClass="blue"
              />
              <StatCard
                icon={TrendingUp}
                label="Amount Paid"
                value={formatINR(dashboard.amount_paid)}
                colorClass="green"
              />
              <StatCard
                icon={AlertCircle}
                label={dashboard.is_overpaid ? 'Overpaid' : 'Remaining'}
                value={formatINR(dashboard.amount_remaining)}
                sub={dashboard.is_overpaid ? 'Client has overpaid' : 'Balance due'}
                colorClass={dashboard.is_overpaid ? 'green' : 'yellow'}
              />
            </div>

            <CategoryBreakdown categories={dashboard.categories} />

          </>
        )}

        {!loading && clients.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No clients yet</h3>
            <p>Go to Settings to add your first client.</p>
          </div>
        )}

      </div>
    </>
  );
}
