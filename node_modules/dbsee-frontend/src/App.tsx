import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SearchCIGPage from './pages/SearchCIGPage';
import TableDetailPage from './pages/TableDetailPage';
import { authAPI } from './services/api';

function App() {
  const hasToken = authAPI.isAuthenticated();
  
  // Debug logging (only in development)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Auth state changed. hasToken:', hasToken);
    }
  }, [hasToken]);
  
  const { data: user, isLoading, error } = useQuery(
    'currentUser',
    authAPI.getCurrentUser,
    {
      enabled: hasToken,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Show loading only when we have a token but are still fetching user data
  if (hasToken && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="spinner w-8 h-8 text-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // For authentication, we consider the user authenticated if:
  // 1. They have a token, AND
  // 2. Either we have user data OR there was an error but we still have a valid token
  // This prevents users from being stuck at login due to API issues
  const isAuthenticated = hasToken && (user || (error && hasToken));

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout>
                <DashboardPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/search"
          element={
            isAuthenticated ? (
              <Layout>
                <SearchCIGPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/table/:tableName"
          element={
            isAuthenticated ? (
              <Layout>
                <TableDetailPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App; 