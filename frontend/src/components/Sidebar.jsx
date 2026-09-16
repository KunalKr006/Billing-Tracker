import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, CreditCard, Clock, Settings, Film, X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/work', label: 'Work', icon: Briefcase },
  { to: '/billing', label: 'Billing', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Film size={20} style={{ color: '#818cf8' }} />
                Ledger
              </h1>
              <p> Billing Tracker</p>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              style={{ display: 'none' }}
              id="sidebar-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Ledger v1.0</p>
          <p style={{ marginTop: 2 }}>© 2026</p>
        </div>
      </aside>
    </>
  );
}
