import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Referrals from './pages/Referrals';
import Products from './pages/Products';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="menu" element={<Products />} />
        <Route path="users" element={<Users />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="referrals" element={<Referrals />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;