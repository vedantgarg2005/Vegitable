import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
      window.location.href = '/login';
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
};

export const ordersAPI = {
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`).then(res => res.data),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  addItemToOrder: (id, data) => api.post(`/orders/${id}/items`, data),
  addChargeToOrder: (id, data) => api.post(`/orders/${id}/charges`, data),
};

export const usersAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
};

export const menuAPI = {
  getMenuItems: (params) => api.get('/admin/menu', { params }),
  getItems: () => api.get('/menu'),
  createMenuItem: (data) => api.post('/admin/menu', data),
  updateMenuItem: (id, data) => api.patch(`/admin/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/admin/menu/${id}`),
};

export const promoAPI = {
  getPromos: () => api.get('/admin/promos'),
  createPromo: (data) => api.post('/admin/promos', data),
};

export const referralAPI = {
  getReferrals: (params) => api.get('/admin/referrals', { params }),
};

export const restaurantAPI = {
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  createRestaurant: (data) => api.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => api.patch(`/admin/restaurants/${id}`, data),
  updateRestaurantStatus: (id, data) => api.patch(`/admin/restaurants/${id}/status`, data),
};

export default api;