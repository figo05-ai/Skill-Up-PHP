import axios from 'axios';

// Since the app is now served by Laravel, we just use /api
const API_BASE = '/api';

console.log('API_BASE:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Helper to convert camelCase to snake_case
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const transformPayload = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => transformPayload(item));
  } else if (data !== null && typeof data === 'object' && !(data instanceof FormData)) {
    const transformed = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        let newKey = toSnakeCase(key);
        // Special manual mappings for relations/ID mismatches
        if (key === 'client') newKey = 'client_id';
        if (key === 'employeeId') newKey = 'user_id';
        
        transformed[newKey] = transformPayload(data[key]);
      }
    }
    return transformed;
  }
  return data;
};

// Attach token automatically if present and map legacy routes
api.interceptors.request.use((config) => {
  if (config.url === '/auth/login') config.url = '/login';
  else if (config.url === '/auth/register') config.url = '/users';
  else if (config.url === '/auth/users') config.url = '/users?type=admin';
  else if (config.url.startsWith('/auth/users/')) config.url = config.url.replace('/auth/users/', '/users/');
  else if (config.url === '/employees') config.url = '/users?type=staff';
  else if (config.url.startsWith('/employees/')) config.url = config.url.replace('/employees/', '/users/');
  else if (config.url === '/auth/updatedetails' || config.url === '/auth/updatepassword') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        config.url = `/users/${u.id || u._id}`;
        config.method = 'put';
      } catch (e) {}
    }
  } else if (config.url === '/auth/log') {
    config.url = '/system-logs-dummy'; // will be caught by a dummy route
  } else if (config.url === '/attendance/history') {
    config.url = '/attendances';
  }

  // Transform payload keys to snake_case for Laravel
  if (config.data && (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
    config.data = transformPayload(config.data);
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and unwrap Laravel format
api.interceptors.response.use(
  (res) => {
    // If the response follows our ApiResponse structure { status: 'Success', data: ... }
    // or if it is a standard Laravel ResourceCollection { data: ... }
    if (res.data) {
      if (res.data.status === 'Success' && res.data.data !== undefined) {
        let payload = res.data.data;
        if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
          payload = payload.data;
        }
        return { ...res, data: payload };
      } else if (res.data.data !== undefined && Array.isArray(res.data.data) && Object.keys(res.data).length <= 2) {
        // Handle Laravel native pagination/collections that only wrap with 'data'
        return { ...res, data: res.data.data };
      }
    }
    return res;
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // redirect to login
      window.location.href = '/login';
    }
    // Unwrap error messages if possible
    if (err.response && err.response.data && err.response.data.message) {
      // Create a structure similar to old errors
      err.response.data.msg = err.response.data.message; 
    }
    return Promise.reject(err);
  }
);

export default api;