import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Database, LogOut, Menu, Search, Home } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success('Logout effettuato con successo');
      navigate('/login');
    } catch (error) {
      toast.error('Errore durante il logout');
    }
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: 'Ricerca CIG',
      href: '/search',
      icon: Search,
      current: location.pathname === '/search'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Effects Neon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-orb-cyan top-1/4 left-1/4"></div>
        <div className="bg-orb-purple top-3/4 right-1/4"></div>
        <div className="bg-orb-pink top-1/2 left-3/4"></div>
      </div>

      {/* Sidebar per desktop - NEON FUTURISTICA */}
      <div className={`
          hidden lg:flex
          fixed top-1/2 left-0 -translate-y-1/2
          h-auto z-40 w-64 flex-col items-center
          sidebar-neon py-8
        `}>
        {/* Header della sidebar - Logo Neon */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-cyan-500/30 w-full mb-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300 animate-glow-pulse">
                <Database className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold gradient-text animate-neon-pulse">
                DBSee
              </span>
              <span className="text-xs text-cyan-400 font-medium tracking-wide">
                Database Explorer
              </span>
            </div>
          </Link>
        </div>

        {/* Navigazione Neon */}
        <nav className="flex-1 space-y-3 w-full px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'sidebar-nav-item-active'
                    : 'sidebar-nav-item'
                } group`}
              >
                <Icon className={`h-5 w-5 nav-icon transition-all duration-300 ${
                  item.current ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-300'
                }`} />
                <span className="font-medium">{item.name}</span>
                {item.current && (
                  <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full shadow-sm animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer della sidebar - Logout Neon */}
        <div className="pt-6 border-t border-cyan-500/30 mt-auto w-full px-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group border border-transparent hover:border-red-500/30"
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-all duration-300" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar per mobile - Overlay Neon */}
      <div className="min-h-screen bg-gray-900">
        {/* Header mobile */}
        <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-cyan-500/30 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 border border-transparent hover:border-cyan-500/30"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">DBSee</span>
            </Link>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Contenuto della pagina */}
        <main className="lg:ml-0 lg:pl-72 relative z-10">
          <div className="container-neon section-padding-neon animate-slide-in">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay per mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full lg:hidden w-64">
            <div className="sidebar-neon h-full flex flex-col py-8">
              {/* Mobile Logo */}
              <div className="flex items-center justify-between h-16 px-6 border-b border-cyan-500/30 w-full mb-8">
                <Link to="/" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold gradient-text">DBSee</span>
                    <span className="text-xs text-cyan-400 font-medium">Database Explorer</span>
                  </div>
                </Link>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 space-y-3 px-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={item.current ? 'sidebar-nav-item-active' : 'sidebar-nav-item'}
                    >
                      <Icon className="h-5 w-5 nav-icon" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="pt-6 border-t border-cyan-500/30 mt-auto px-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group border border-transparent hover:border-red-500/30"
                >
                  <LogOut className="h-5 w-5 group-hover:rotate-12 transition-all duration-300" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout; 