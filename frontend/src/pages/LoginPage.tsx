import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { Eye, EyeOff, Database, Zap, Lock, User, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation(authAPI.login, {
    onSuccess: () => {
      toast.success('Login effettuato con successo!');
      // Invalidate queries to refresh authentication state
      queryClient.invalidateQueries();
      // Navigate immediately since we have proper state management
      navigate('/', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Errore durante il login');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center">
      {/* Background Effects Neon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-orb-cyan top-1/4 left-1/4"></div>
        <div className="bg-orb-purple top-3/4 right-1/4"></div>
        <div className="bg-orb-pink top-1/2 left-3/4"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-pulse"></div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-glow-pulse">
                <Database className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl opacity-20 blur-lg"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-cyan-400 animate-bounce-icon" />
            <h1 className="text-4xl font-bold gradient-text animate-neon-pulse">
              DBSee
            </h1>
            <Zap className="h-8 w-8 text-purple-400 animate-bounce-icon" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <p className="text-lg text-gray-400 mb-2">Database Explorer</p>
          <p className="text-sm text-gray-500">
            Accedi al <span className="gradient-text-purple font-semibold">futuro</span> dei database
          </p>
        </div>

        {/* Login Form */}
        <div className="card-neon p-8 backdrop-blur-xl animate-slide-in">
          <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-cyan-400" />
            Accesso Sicuro
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-400" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="inserisci il tuo username"
                className="input-neon text-white placeholder:text-gray-500"
                required
                disabled={loginMutation.isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="inserisci la password"
                  className="input-neon text-white placeholder:text-gray-500 pr-12"
                  required
                  disabled={loginMutation.isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-300 transition-colors duration-300"
                  disabled={loginMutation.isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isLoading}
              className="btn-neon w-full mt-8 group"
            >
              {loginMutation.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner-neon w-4 h-4" />
                  <span>Accesso...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Accedi al Sistema</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <h3 className="text-sm font-medium text-cyan-300 mb-2 flex items-center gap-2">
              🚀 Credenziali Demo
            </h3>
            <div className="space-y-1 text-xs text-gray-400">
              <p><span className="text-cyan-400">Username:</span> admin</p>
              <p><span className="text-purple-400">Password:</span> admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Accedendo accetti i{' '}
            <Link to="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300">
              termini di servizio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 