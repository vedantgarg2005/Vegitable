import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { showMessage } from 'react-native-flash-message';

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'SET_USER', payload: user });
      showMessage({
        message: 'Login Successful',
        type: 'success',
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'SET_USER', payload: user });
      showMessage({
        message: 'Registration Successful',
        type: 'success',
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
      showMessage({
        message: 'Logged out successfully',
        type: 'info',
      });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
      showMessage({
        message: 'Profile updated successfully',
        type: 'success',
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      showMessage({
        message,
        type: 'danger',
      });
      return { success: false, error: message };
    }
  };

  const setUser = async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setToken = async (token) => {
    await AsyncStorage.setItem('token', token);
  };

  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount?.();
    } catch (error) {
      console.log('Delete account error:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
      showMessage({ message: 'Account deleted successfully', type: 'info' });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    setUser,
    setToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}