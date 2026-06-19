import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const deliveryAPI = {
  getAssignedOrders: () => api.get('/orders/assigned'),
  updateOrderStatus: (id, status, note) =>
    api.patch(`/orders/${id}/status`, { status, note }),
  updateLocation: (latitude, longitude) =>
    api.patch('/fleet/location', { latitude, longitude }),
  updateStatus: (status) => api.patch('/fleet/status', { status }),
  getPerformance: () => api.get('/fleet/performance'),
};

export default api;
