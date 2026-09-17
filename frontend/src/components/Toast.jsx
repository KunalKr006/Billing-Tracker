import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle size={16} />}
            {t.type === 'error'   && <XCircle size={16} />}
            {t.type === 'info'    && <Info size={16} />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return (message, type = 'info') => console.log(`[Toast ${type}]: ${message}`);
  }
  return ctx;
};

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' && <CheckCircle size={16} />}
        {type === 'error' && <XCircle size={16} />}
        {type === 'info' && <Info size={16} />}
        <span style={{ flex: 1 }}>{message}</span>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
