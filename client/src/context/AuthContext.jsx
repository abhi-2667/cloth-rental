import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/users/profile');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (email, password, expectedRole) => {
    const res = await api.post('/auth/login', { email, password });

    if (expectedRole && res.data.user?.role !== expectedRole) {
      throw new Error(
        expectedRole === 'admin'
          ? 'This account is not an admin account.'
          : 'This account is an admin account. Use admin login instead.'
      );
    }

    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const requestLoginLink = useCallback(async (email, expectedRole) => {
    const res = await api.post('/auth/login/request-link', { email, expectedRole });
    return res.data;
  }, []);

  const verifyLoginLink = useCallback(async (token) => {
    const res = await api.post('/auth/login/verify-link', { token });

    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const requestSignupLink = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register/request-link', { name, email, password });
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  }, []);

  const verifySignupLink = useCallback(async (token) => {
    const res = await api.post('/auth/register/verify-link', { token });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    login,
    requestLoginLink,
    verifyLoginLink,
    requestSignupLink,
    register,
    verifySignupLink,
    logout,
    loading,
  }), [user, login, requestLoginLink, verifyLoginLink, requestSignupLink, register, verifySignupLink, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
