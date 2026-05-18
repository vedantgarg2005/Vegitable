import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  if (__DEV__) {
    return 'http://192.168.1.6:5000/api';
  }
  return 'https://your-production-api.com/api';
};

export const BASE_URL = getBaseUrl();
export const SOCKET_URL = BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Order services
export const orderService = {
  getAssignedOrders: () => api.get('/orders/assigned'),
  updateOrderStatus: (orderId, status, note) =>
    api.patch(`/orders/${orderId}/status`, { status, note }),
  getOrderDetails: (orderId) => api.get(`/orders/${orderId}`),
};

// Fleet services
export const fleetService = {
  updateLocation: (latitude, longitude) =>
    api.patch('/fleet/location', { latitude, longitude }),
  updateStatus: (status) =>
    api.patch('/fleet/status', { status }),
  getPerformance: () => api.get('/fleet/performance'),
};

// Location service
export const locationService = {
  updateLocation: async (location) => {
    try {
      await fleetService.updateLocation(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  },
};
