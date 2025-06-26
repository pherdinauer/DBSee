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
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar per desktop */}
      <div className={
        `
          hidden lg:flex
          fixed top-1/2 left-0 -translate-y-1/2
          h-auto z-40 w-64 flex-col items-center bg-white shadow-lg rounded-r-2xl py-8
          border-r border-neutral-200
        `
      }>
        {/* Header della sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 w-full">
          <Link to="/" className="flex items-center space-x-3 group">
            <>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-200"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors duration-200">
                  DBSee
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  Database Explorer
                </span>
              </div>
            </>
          </Link>
        </div>
        {/* Navigazione */}
        <nav className="flex-1 space-y-2 w-full mt-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.current
                    ? 'bg-primary-600 text-white shadow-colored'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <>
                  <Icon className={`h-5 w-5 ${item.current ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-600'} transition-colors duration-200`} />
                  <span className="font-medium">{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm" />
                  )}
                </>
              </Link>
            );
          })}
        </nav>
        {/* Footer della sidebar */}
        <div className="pt-6 border-t border-neutral-200 mt-auto w-full px-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-neutral-600 rounded-xl hover:text-danger-600 hover:bg-danger-50 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:text-danger-600 transition-colors duration-200" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar per mobile (resta invariata) */}
      <div className="min-h-screen bg-neutral-50">
        {/* Header mobile */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-neutral-900">DBSee</span>
              </>
            </Link>
            <div className="w-10"></div>
          </div>
        </div>
        {/* Contenuto della pagina */}
        <main className="container-custom section-padding animate-fade-in">
          {children}
        </main>
      </div>
      {/* Overlay per mobile (resta invariata) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout; 