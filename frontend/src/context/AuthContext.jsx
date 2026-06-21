import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { loginOpenRef } from './CartContext';

const AuthContext = createContext();
export const useLoginModal = () => useContext(LoginModalContext);
export const LoginModalContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  // Called after OTP flow completes (Login.jsx handles the API calls directly)
  const login = (userData, token) => {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Kept for any legacy email/password usage
  const loginWithEmail = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (name, email, password, phone) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const [loginOpen, setLoginOpen] = useState(false);
  const openLogin  = useCallback(() => { loginOpenRef.current = true;  setLoginOpen(true);  }, []);
  const closeLogin = useCallback(() => { loginOpenRef.current = false; setLoginOpen(false); }, []);

  const [profileOpen, setProfileOpen] = useState(false);
  const openProfile  = useCallback(() => setProfileOpen(true),  []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ loginOpen, openLogin, closeLogin, profileOpen, setProfileOpen, openProfile, closeProfile }}>
      <AuthContext.Provider value={{ user, login, loginWithEmail, register, logout }}>
        {children}
      </AuthContext.Provider>
    </LoginModalContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
