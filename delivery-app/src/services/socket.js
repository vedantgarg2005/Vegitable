import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

let socket = null;

export const getSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'] });
    if (userId) socket.emit('join', userId);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
