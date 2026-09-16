import { Menu } from 'lucide-react';
import MonthSelector from './MonthSelector';

export default function Header({ title, subtitle, onMenuToggle, showMonthSelector, month, year, onMonthChange, onYearChange }) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="mobile-nav-toggle btn btn-ghost btn-icon" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div>
          <div className="header-title">{title}</div>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
      </div>
      {showMonthSelector && (
        <MonthSelector month={month} year={year} onMonthChange={onMonthChange} onYearChange={onYearChange} />
      )}
    </header>
  );
}
