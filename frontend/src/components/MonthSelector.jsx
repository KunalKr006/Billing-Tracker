import { useState } from 'react';
import { MONTHS } from '../services/api';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

export default function MonthSelector({ month, year, onMonthChange, onYearChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handlePrev = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  const years = Array.from({ length: 7 }, (_, i) => year - 3 + i);

  return (
    <>
      {/* Desktop Inline Month Selector */}
      <div className="month-selector desktop-month-selector">
        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={handlePrev} title="Previous month">
          <ChevronLeft size={16} />
        </button>
        <select value={month} onChange={e => onMonthChange(Number(e.target.value))}>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={e => onYearChange(Number(e.target.value))}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={handleNext} title="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mobile Calendar Trigger Button */}
      <button
        className="mobile-calendar-btn btn btn-secondary btn-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Calendar size={16} style={{ color: 'var(--primary-light)' }} />
        <span>{MONTHS[month - 1]} {year}</span>
      </button>

      {/* Mobile Calendar Selector Modal Popover */}
      {mobileOpen && (
        <div className="modal-overlay" onClick={() => setMobileOpen(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: 'var(--primary-light)' }} />
                Select Month & Year
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <button className="btn btn-secondary btn-icon" onClick={handlePrev}>
                  <ChevronLeft size={18} />
                </button>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                  {MONTHS[month - 1]} {year}
                </div>
                <button className="btn btn-secondary btn-icon" onClick={handleNext}>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={month}
                    onChange={e => onMonthChange(Number(e.target.value))}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={year}
                    onChange={e => onYearChange(Number(e.target.value))}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setMobileOpen(false)} style={{ width: '100%', justifyContent: 'center' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
