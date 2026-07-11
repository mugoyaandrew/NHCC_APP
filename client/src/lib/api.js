const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Entity APIs
export const incomeApi = {
  list: () => api.get('/income'),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

export const expenseApi = {
  list: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const goalsApi = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const accountsApi = {
  list: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

export const investmentsApi = {
  list: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`),
};

export const projectsApi = {
  list: (filters) => api.get('/projects' + buildQuery(filters)),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const tasksApi = {
  list: (filters) => api.get('/tasks' + buildQuery(filters)),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const subtasksApi = {
  list: (taskId) => api.get(`/subtasks/${taskId}`),
  create: (taskId, data) => api.post(`/subtasks/${taskId}`, data),
  toggle: (id) => api.put(`/subtasks/${id}/toggle`, {}),
  delete: (id) => api.delete(`/subtasks/${id}`),
};

export const commentsApi = {
  list: (taskId) => api.get(`/comments/${taskId}`),
  create: (taskId, data) => api.post(`/comments/${taskId}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const documentsApi = {
  list: (filters) => api.get('/documents' + buildQuery(filters)),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  upload: (file, projectId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('project_id', projectId);
    const token = localStorage.getItem('token');
    return fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(r => r.json());
  },
};

export const approvalsApi = {
  list: (filters) => api.get('/approvals' + buildQuery(filters)),
  create: (data) => api.post('/approvals', data),
  review: (id, data) => api.post(`/approvals/${id}/review`, data),
  update: (id, data) => api.put(`/approvals/${id}`, data),
  delete: (id) => api.delete(`/approvals/${id}`),
};

export const siteReportsApi = {
  list: (filters) => api.get('/site-reports' + buildQuery(filters)),
  create: (data) => api.post('/site-reports', data),
  update: (id, data) => api.put(`/site-reports/${id}`, data),
  delete: (id) => api.delete(`/site-reports/${id}`),
};

export const announcementsApi = {
  list: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const messagesApi = {
  list: () => api.get('/messages'),
  create: (data) => api.post('/messages', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  delete: (id) => api.delete(`/messages/${id}`),
};

export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  dashboardStats: () => api.get('/users/stats/dashboard'),
  finaraStats: () => api.get('/users/stats/finara'),
};

export const auditApi = {
  list: (limit = 100) => api.get(`/audit?limit=${limit}`),
};

export const seedApi = {
  generate: () => api.post('/seed/synthetic', {}),
  purge: () => api.delete('/seed/synthetic'),
};

export const reportsApi = {
  generateCeo: () => api.post('/reports/ceo', {}),
};

export const mlApi = {
  forecastBudget: (data) => fetch('/api/ml/forecast/budget', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) }).then(r => r.json()),
  classifyRisk: (data) => fetch('/api/ml/risk/classify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) }).then(r => r.json()),
};

function buildQuery(filters) {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') params.append(key, val);
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}
