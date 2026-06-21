import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

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
  const openLogin  = useCallback(() => setLoginOpen(true),  []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ loginOpen, openLogin, closeLogin }}>
      <AuthContext.Provider value={{ user, login, loginWithEmail, register, logout }}>
        {children}
      </AuthContext.Provider>
    </LoginModalContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
