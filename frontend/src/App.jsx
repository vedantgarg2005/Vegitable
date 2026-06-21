import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminApp from './admin/AdminApp';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProfileDrawer from './components/ProfileDrawer';
import Home from './pages/Home';
import OrderDetail from './pages/OrderDetail';
import LoginModal from './pages/Login';
import Addresses from './pages/Addresses';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Checkout from './pages/Checkout';
import About from './pages/About';
import HelpCenter from './pages/HelpCenter';
import RequestProduct from './pages/RequestProduct';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  return (
    <>
      {/* Navbar: always shown on mobile home (desktop home has its own header) */}
      {!isHome && <Navbar />}
      <div className={!isHome ? 'pb-16 sm:pb-0 page-enter' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Navigate to="/" replace />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Navigate to="/" replace />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/request-product" element={<RequestProduct />} />
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
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Layout />} />
          </Routes>
          <CartDrawer />
          <ProfileDrawer />
          <ScrollToTop />
          <LoginModal />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
