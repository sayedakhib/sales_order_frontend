import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 20000,
});

// Unwrap { success, data } and surface a clean error message.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export default api;
