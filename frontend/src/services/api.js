import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Currency formatter ────────────────────────────────────────────────────────
export const formatINR = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Clients ───────────────────────────────────────────────────────────────────
export const clientsAPI = {
  list: () => api.get('/api/clients'),
  get: (id) => api.get(`/api/clients/${id}`),
  create: (data) => api.post('/api/clients', data),
  update: (id, data) => api.put(`/api/clients/${id}`, data),
  delete: (id) => api.delete(`/api/clients/${id}`),
};

// ─── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list: () => api.get('/api/categories'),
  get: (id) => api.get(`/api/categories/${id}`),
  create: (data) => api.post('/api/categories', data),
  update: (id, data) => api.put(`/api/categories/${id}`, data),
  delete: (id) => api.delete(`/api/categories/${id}`),
};

// ─── Work ─────────────────────────────────────────────────────────────────────
export const workAPI = {
  list: (params = {}) => api.get('/api/work', { params }),
  get: (id) => api.get(`/api/work/${id}`),
  create: (data) => api.post('/api/work', data),
  update: (id, data) => api.put(`/api/work/${id}`, data),
  delete: (id) => api.delete(`/api/work/${id}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  list: (params = {}) => api.get('/api/payments', { params }),
  get: (id) => api.get(`/api/payments/${id}`),
  create: (data) => api.post('/api/payments', data),
  update: (id, data) => api.put(`/api/payments/${id}`, data),
  delete: (id) => api.delete(`/api/payments/${id}`),
};

// ─── Billing ──────────────────────────────────────────────────────────────────
export const billingAPI = {
  get: (clientId, year, month) => api.get(`/api/billing/${clientId}/${year}/${month}`),
  history: (clientId) => api.get(`/api/billing/${clientId}/history`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (clientId, year, month) => api.get(`/api/dashboard/${clientId}/${year}/${month}`),
};

export default api;
