import { Platform } from 'react-native';

export const API_BASE_URL = __DEV__
  ? 'http://172.20.10.2:5000/api'
  : 'https://your-production-api.com/api';

export const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const ORDER_STATUS = {
  CONFIRMED: 'confirmed',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
};

export const STATUS_LABELS = {
  confirmed: 'Confirm Pickup',
  picked_up: 'Mark Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Mark Delivered',
};

export const STATUS_NEXT = {
  confirmed: 'picked_up',
  picked_up: 'out_for_delivery',
  out_for_delivery: 'delivered',
};
