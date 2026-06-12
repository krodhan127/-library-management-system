import React from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
        <span style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Connecting to Library Management System...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  // Fallback
  return <AuthPage />;
}

export default App;
