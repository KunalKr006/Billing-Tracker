import { useEffect, useRef, useState } from 'react';

export default function CustomSelect({ value, onChange, options, className = 'form-select', placeholder = 'Select option', ariaLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find(option => String(option.value) === String(value));

  useEffect(() => {
    const close = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="custom-select-wrap" ref={containerRef}>
      <button type="button" className={`${className} custom-select-trigger`} onClick={() => setOpen(current => !current)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}>
        {selected?.label || placeholder}
      </button>
      {open && (
        <div className="custom-select-menu" role="listbox">
          {options.map(option => (
            <button type="button" className="custom-select-option" key={String(option.value)} onClick={() => { onChange(option.value); setOpen(false); }}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
