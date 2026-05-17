import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { showMessage } from 'react-native-flash-message';
import { walletAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await walletAPI.getWallet();
      setBalance(data.balance ?? 0);
      setTransactions(data.transactions ?? []);
    } catch (error) {
      console.error('Wallet fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <WalletContext.Provider value={{ balance, transactions, loading, fetchWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
