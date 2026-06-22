import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  BarChart3,
  Gift,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
  Star,
  Megaphone,
  UserCheck,
  Wallet,
  Clock,
  PackagePlus,
} from 'lucide-react';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Products', href: '/admin/menu', icon: Store },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Delivery Control', href: '/admin/delivery-control', icon: Truck },
    { name: 'Delivery Partners', href: '/admin/delivery-partners', icon: UserCheck },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
    { name: 'Wallet', href: '/admin/wallet', icon: Wallet },
    { name: 'Store Hours', href: '/admin/store-settings', icon: Clock },
    { name: 'Product Requests', href: '/admin/product-requests', icon: PackagePlus },
  ];

  const isActive = (path) => location.pathname === path;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">🥦</span>
          </div>
          {!collapsed && <h1 className="text-lg font-bold text-white">Fresh Tokri</h1>}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-md text-white/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <div className="hidden lg:flex justify-center pt-3">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="mt-6 px-2 flex-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive(item.href)
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${!collapsed ? 'mr-3' : ''} ${
                  isActive(item.href) ? 'text-white' : 'text-white/50 group-hover:text-white'
                }`} />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center mb-3 px-1">
            <div className="h-9 w-9 bg-primary-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-sm font-bold text-white">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-white/70 rounded-lg hover:bg-white/10 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className={`h-4 w-4 flex-shrink-0 ${!collapsed ? 'mr-3' : ''}`} />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-100">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col shadow-2xl transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden`}
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        {sidebarContent}
      </div>

      <div
        className={`hidden lg:flex flex-col flex-shrink-0 shadow-2xl transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)' }}
      >
        {sidebarContent}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {navigation.find((n) => n.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {navigation.find((n) => n.href === location.pathname)?.description ||
                    (() => {
                      const descriptions = {
                        '/admin': 'Overview of your store performance',
                        '/admin/orders': 'Track and manage all customer orders',
                        '/admin/menu': 'Manage your product listings',
                        '/admin/users': 'View and manage customers',
                        '/admin/analytics': 'Sales and performance insights',
                        '/admin/delivery-control': 'Monitor live deliveries',
                        '/admin/delivery-partners': 'Manage delivery staff',
                        '/admin/reviews': 'Customer feedback and ratings',
                        '/admin/campaigns': 'Promotions and marketing',
                        '/admin/notifications': 'Send and manage alerts',
                        '/admin/wallet': 'Earnings and transactions',
                        '/admin/store-settings': 'Configure store hours',
                      };
                      return descriptions[location.pathname] || '';
                    })()}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
