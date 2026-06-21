import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getProfile: () => api.get('/admin/profile'),
  logout: () => api.post('/admin/logout'),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRevenue: (period) => api.get(`/admin/analytics/revenue?period=${period}`),
  getPopularItems: () => api.get('/admin/analytics/popular-items'),
  getHourlyOrders: () => api.get('/admin/analytics/hourly-orders'),
};

export const ordersAPI = {
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`).then(res => res.data),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  refundOrder: (id, data) => api.post(`/admin/orders/${id}/refund`, data),
};

export const usersAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
};

const toFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v) || (typeof v === 'object' && !(v instanceof File))) {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, v);
    }
  });
  return fd;
};

export const menuAPI = {
  getMenuItems: (params) => api.get('/admin/menu', { params }),
  getItems: () => api.get('/admin/products').then(res => res.data),
  createMenuItem: (data) => api.post('/admin/menu', toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMenuItem: (id, data) => api.patch(`/admin/menu/${id}`, toFormData(data), { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMenuItem: (id) => api.delete(`/admin/menu/${id}`),
  toggleStock: (id, isAvailable) => api.patch(`/admin/menu/${id}/stock`, { isAvailable }),
};

export const promoAPI = {
  getPromos: () => api.get('/admin/promos'),
  createPromo: (data) => api.post('/admin/promos', data),
};

export const reviewsAPI = {
  getReviews: (params) => api.get('/admin/reviews', { params }),
  verifyReview: (id, isVerified) => api.patch(`/admin/reviews/${id}/verify`, { isVerified }),
  respondToReview: (id, message) => api.patch(`/admin/reviews/${id}/respond`, { message }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

export const campaignsAPI = {
  getCampaigns: () => api.get('/admin/campaigns'),
  createCampaign: (data) => api.post('/admin/campaigns', data),
  updateCampaign: (id, data) => api.patch(`/admin/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/admin/campaigns/${id}`),
};

export const notificationsAPI = {
  broadcast: (data) => api.post('/admin/notifications/broadcast', data),
  getHistory: (params) => api.get('/admin/notifications/history', { params }),
};

export const deliveryPartnersAPI = {
  getPartners: (params) => api.get('/admin/delivery-partners', { params }),
  addPartner: (data) => api.post('/admin/delivery-partners', data),
  updateStatus: (id, isActive) => api.patch(`/admin/delivery-partners/${id}/status`, { isActive }),
  deletePartner: (id) => api.delete(`/admin/delivery-partners/${id}`),
};

export const deliveryControlAPI = {
  getStatus: () => api.get('/admin/delivery-control'),
  toggle: () => api.post('/admin/delivery-control/toggle'),
  setEnabled: (enabled) => api.post('/admin/delivery-control/set', { enabled }),
  setAgentStatus: (fleetId, status) => api.patch(`/admin/delivery-control/agents/${fleetId}/status`, { status }),
  reassign: (orderId, newAgentId) => api.post('/admin/delivery-control/reassign', { orderId, newAgentId }),
  cancelDelivery: (orderId, reason) => api.post(`/admin/delivery-control/cancel-delivery/${orderId}`, { reason }),
};

export const walletAPI = {
  getUsersWithWallet: (params) => api.get('/admin/users', { params }),
  creditWallet: (userId, data) => api.post(`/admin/users/${userId}/wallet/credit`, data),
  debitWallet: (userId, data) => api.post(`/admin/users/${userId}/wallet/debit`, data),
};

export const storeSettingsAPI = {
  getSettings: () => api.get('/admin/store-settings'),
  updateSettings: (schedule) => api.put('/admin/store-settings', { schedule }),
};

export default api;
