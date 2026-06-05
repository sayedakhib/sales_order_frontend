import api from './client.js';

// ---- Customers ----
export const fetchCustomers = (params) => api.get('/customers', { params }).then((r) => r.data);
export const searchCustomers = (q) => api.get('/customers/search', { params: { q } }).then((r) => r.data);
export const fetchCustomer = (id) => api.get(`/customers/${id}`).then((r) => r.data);
export const fetchCustomerOutstanding = (id) =>
  api.get(`/customers/${id}/outstanding`).then((r) => r.data);
export const fetchCustomerHistory = (id) =>
  api.get(`/customers/${id}/history`).then((r) => r.data);

// ---- Products ----
export const fetchProducts = (params) => api.get('/products', { params }).then((r) => r.data);
export const searchProducts = (q) => api.get('/products/search', { params: { q } }).then((r) => r.data);
export const fetchProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const fetchSimilar = (id) => api.get(`/products/${id}/similar`).then((r) => r.data);
export const fetchComparison = (id) => api.get(`/products/${id}/comparison`).then((r) => r.data);
export const fetchVariations = (id) => api.get(`/products/${id}/variations`).then((r) => r.data);

// ---- Orders ----
export const fetchOrders = (params) => api.get('/orders', { params }).then((r) => r.data);
export const fetchOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (payload) => api.post('/orders', payload).then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);
export const emailOrder = (id) => api.post(`/orders/${id}/email`).then((r) => r.data);
export const orderPdfUrl = (id) =>
  `${import.meta.env.VITE_API_BASE || '/api'}/orders/${id}/pdf`;

// ---- Meta ----
export const fetchCompany = () => api.get('/meta/company').then((r) => r.data);
export const fetchUsers = (role) => api.get('/meta/users', { params: { role } }).then((r) => r.data);
