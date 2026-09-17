import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Work from './pages/Work';
import Billing from './pages/Billing';
import Payments from './pages/Payments';
import History from './pages/History';
import Settings from './pages/Settings';
import { clientsAPI } from './services/api';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await clientsAPI.list();
      setClients(res.data);
      if (res.data.length > 0 && !selectedClientId) {
        setSelectedClientId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    }
  };

  return (
    <Router>
      <div className="app-container app-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
        />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  clientId={selectedClientId}
                  showToast={showToast}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/work"
              element={
                <Work
                  clientId={selectedClientId}
                  showToast={showToast}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/billing"
              element={
                <Billing
                  clientId={selectedClientId}
                  showToast={showToast}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/payments"
              element={
                <Payments
                  clientId={selectedClientId}
                  showToast={showToast}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/history"
              element={
                <History
                  clientId={selectedClientId}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <Settings
                  clients={clients}
                  refreshClients={fetchClients}
                  showToast={showToast}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Router>
  );
}
