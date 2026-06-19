import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { showMessage } from 'react-native-flash-message';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) setUserState(JSON.parse(userData));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async ({ phone, password }) => {
    try {
      const { data } = await authAPI.login({ phone, password });
      if (data.user.role !== 'delivery_partner') {
        showMessage({ message: 'Access denied. Not a delivery partner account.', type: 'danger' });
        return false;
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUserState(data.user);
      return true;
    } catch (e) {
      showMessage({ message: e.response?.data?.message || 'Login failed', type: 'danger' });
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
