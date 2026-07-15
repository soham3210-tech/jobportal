import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const loadUser = async (token) => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const decoded = decodeToken(token);
      const isEmployer = decoded?.user?.type === 'employer';
      
      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const endpoint = isEmployer ? '/api/employers/profile' : '/api/users/profile';
      const res = await axios.get(endpoint, config);
      
      setUser({
        ...res.data,
        role: isEmployer ? 'employer' : 'candidate'
      });
    } catch (err) {
      console.error('Error loading user profile:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    loadUser(token);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await axios.post('/api/users/login', { email, password });
      } catch (err) {
        // If candidate login fails with invalid credentials, try employer login
        if (err.response?.status === 400 && (err.response?.data?.msg === 'Invalid credentials' || err.response?.data?.error === 'Invalid credentials')) {
          res = await axios.post('/api/employers/login', { email, password });
        } else {
          throw err;
        }
      }

      const { token } = res.data;
      localStorage.setItem('token', token);
      await loadUser(token);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.msg || err.response?.data?.error || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const isEmployer = !!userData.companyName;
      const endpoint = isEmployer ? '/api/employers/register' : '/api/users/register';
      const res = await axios.post(endpoint, userData);
      
      const { token } = res.data;
      localStorage.setItem('token', token);
      await loadUser(token);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.msg || err.response?.data?.error || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};