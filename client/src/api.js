const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('tiffinflow_token') || 'demo-token';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...options.headers };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Plans
  getPlans: () => request('/plans'),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers?${query}`);
  },
  lookupPhone: (phone) => request(`/customers/lookup?phone=${encodeURIComponent(phone)}`),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Subscriptions & Operations
  getStats: () => request('/subscriptions/stats'),
  getKitchenDispatch: (date) => request(`/subscriptions/dispatch?date=${encodeURIComponent(date || '')}`),
  createSubscription: (data) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  pauseSubscription: (id, data) => request(`/subscriptions/${id}/pause`, { method: 'POST', body: JSON.stringify(data) }),
  resumeSubscription: (id) => request(`/subscriptions/${id}/resume`, { method: 'POST' }),

  // Pro-Rated Billing
  calculateBill: (subscriptionId, month) => request(`/billing/calculate/${subscriptionId}?month=${encodeURIComponent(month || '')}`),
  generateInvoice: (subscriptionId, month) => request('/billing/generate-invoice', {
    method: 'POST',
    body: JSON.stringify({ subscription_id: subscriptionId, billing_month: month })
  }),
  getInvoices: (page = 1, limit = 10) => request(`/billing/invoices?page=${page}&limit=${limit}`),
  payInvoice: (id) => request(`/billing/invoices/${id}/pay`, { method: 'POST' })
};
