import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  History,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ onLogout, isOpen, toggleSidebar, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales' },
    { id: 'products', label: 'Products', icon: Package, path: '/products' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'debts', label: 'Debts', icon: FileText, path: '/debts' },
    { id: 'history', label: 'History', icon: History, path: '/history' },
  ];

  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to end your session?</p>

              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Button - Only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
        >
          <Menu size={24} className="text-gray-800" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 
          bg-gradient-to-b from-gray-800 via-gray-900 to-gray-950
          border-r border-gray-700
          text-gray-200 shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              POS System
            </h1>
            <p className="text-xs text-gray-400 mt-1">Point of Sale</p>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1 hover:bg-gray-800 rounded transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200 font-medium
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'animate-pulse-slow' : ''} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg
              bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
              text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl
              active:scale-95"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
