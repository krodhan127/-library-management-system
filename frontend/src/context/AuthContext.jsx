import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const API_BASE_URL = 'http://localhost:8080/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user session from localStorage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('library_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('library_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('library_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (username, password, name, role) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name, role }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Registration failed');
      }

      const userData = await response.json();
      // Auto login user after registration
      setUser(userData);
      localStorage.setItem('library_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('library_user');
  };

  // Helper to construct headers with the current user authentication context
  const getAuthHeaders = () => {
    if (!user) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'X-User-Role': user.role,
      'X-User-Id': user.id.toString(),
    };
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, getAuthHeaders, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
