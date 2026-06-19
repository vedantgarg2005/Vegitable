import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminApp from './admin/AdminApp';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Wallet from './pages/Wallet';
import Notifications from './pages/Notifications';

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  return (
    <>
      {!isHome && <Navbar />}
      <div className={!isHome ? 'pb-16 sm:pb-0 page-enter' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: 14, fontWeight: 600, fontSize: 13, padding: '10px 16px' },
              success: { iconTheme: { primary: '#2E7D32', secondary: 'white' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Layout />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
