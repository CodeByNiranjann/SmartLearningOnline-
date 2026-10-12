import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  logoutAllSessions,
  fetchUserProfile,
  fetchActiveSessions,
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth & session state on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedSessionId = localStorage.getItem('sessionId');

      if (storedToken && storedSessionId) {
        try {
          const profileData = await fetchUserProfile();
          setUser(profileData.user || profileData);
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearAuthData();
        }
      } else {
        clearAuthData();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    setToken(null);
    setSessionId(null);
    setUser(null);
  };

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('sessionId', data.sessionId);
    setToken(data.token);
    setSessionId(data.sessionId);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('sessionId', data.sessionId);
    setToken(data.token);
    setSessionId(data.sessionId);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      clearAuthData();
    }
  };

  const logoutAll = async () => {
    try {
      await logoutAllSessions();
    } catch (err) {
      console.warn('Logout all API error:', err.message);
    } finally {
      clearAuthData();
    }
  };

  const getSessions = async () => {
    return await fetchActiveSessions();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionId,
        loading,
        isAuthenticated: !!user && !!token && !!sessionId,
        login,
        register,
        logout,
        logoutAll,
        getSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
