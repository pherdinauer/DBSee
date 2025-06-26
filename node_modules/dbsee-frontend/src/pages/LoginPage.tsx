import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { Database, Eye, EyeOff, Sparkles, Shield, Zap } from 'lucide-react';
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
      toast.success('Benvenuto in DBSee! 🎉');
      // Invalidate queries and force a refresh
      queryClient.invalidateQueries('currentUser');
      queryClient.refetchQueries('currentUser');
      // Small delay to ensure token is properly set
      setTimeout(() => {
      navigate('/');
      }, 100);
    },
    onError: () => {
      toast.error('Credenziali non valide. Riprova.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Compila tutti i campi');
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const features = [
    {
      icon: Database,
      title: 'Esplora Database',
      description: 'Naviga e analizza i tuoi dati con facilità'
    },
    {
      icon: Zap,
      title: 'Ricerca Veloce',
      description: 'Trova quello che cerchi in tempo reale'
    },
    {
      icon: Shield,
      title: 'Sicuro & Affidabile',
      description: 'I tuoi dati sono protetti e al sicuro'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex">
      {/* Sezione sinistra - Features */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 lg:py-12">
        <div className="mx-auto max-w-md">
          {/* Logo e titolo */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-accent-500 animate-pulse-soft" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              DBSee
            </h1>
            <p className="text-neutral-600 text-lg">
              La tua finestra sui dati
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-start space-x-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-200/50 animate-slide-up"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
        <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sezione destra - Form di login */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Header mobile */}
          <div className="text-center lg:hidden mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Benvenuto in DBSee
            </h2>
            <p className="text-neutral-600 text-sm mt-2">
              Accedi al tuo account per continuare
            </p>
          </div>

          {/* Header desktop */}
          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Accedi al tuo account
          </h2>
            <p className="text-neutral-600">
              Inserisci le tue credenziali per continuare
          </p>
        </div>

          {/* Form di login */}
          <div className="card p-8 animate-scale-in">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Nome utente
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input"
                  placeholder="Inserisci il tuo username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
              />
            </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                Password
              </label>
                <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                    className="input pr-12"
                    placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
              />
              <button
                type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                ) : (
                      <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

            <button
              type="submit"
              disabled={loginMutation.isLoading}
                className="btn-primary w-full btn-lg"
            >
              {loginMutation.isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="spinner w-4 h-4" />
                    Accesso in corso...
                </div>
              ) : (
                  'Accedi'
              )}
            </button>
            </form>
          </div>

          {/* Credenziali demo */}
          <div className="mt-6">
            <div className="alert-info">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Database className="h-3 w-3 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-medium text-primary-900 mb-2">
                    Credenziali Demo
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Username:</span>
                      <code className="px-2 py-1 bg-primary-100 rounded text-primary-800">admin</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Password:</span>
                      <code className="px-2 py-1 bg-primary-100 rounded text-primary-800">admin123</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 