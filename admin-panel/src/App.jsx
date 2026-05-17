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
import Settings from './pages/Settings';
import DeliveryControl from './pages/DeliveryControl';
import DeliveryPartners from './pages/DeliveryPartners';
import Reviews from './pages/Reviews';
import Campaigns from './pages/Campaigns';
import Notifications from './pages/Notifications';
import Wallet from './pages/Wallet';

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
        <Route path="settings" element={<Settings />} />
        <Route path="delivery-control" element={<DeliveryControl />} />
        <Route path="delivery-partners" element={<DeliveryPartners />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="wallet" element={<Wallet />} />
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