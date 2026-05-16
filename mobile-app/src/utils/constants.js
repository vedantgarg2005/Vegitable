import { Platform } from 'react-native';

// API Configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Use LAN IP for both Android and physical iOS devices
    // iOS Simulator can use localhost, but physical devices need the LAN IP
    if (Platform.OS === 'android') {
      return 'http://192.168.1.6:5000/api';
    }
    return 'http://192.168.1.6:5000/api'; // Use LAN IP for physical iOS device too
  }
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

// App Constants
export const APP_NAME = 'New Delhi Sweets';
export const CURRENCY = '₹';

// Order status constants matching backend enum
export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Animation Durations
export const FREE_DELIVERY_THRESHOLD = 199;
export const STANDARD_DELIVERY_FEE = 30;
export const getDeliveryFee = (subtotal) => subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};