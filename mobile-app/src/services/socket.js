import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/constants';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'] });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
