import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => void;
  updateProfileKeys: (geminiApiKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('flowgenius_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('flowgenius_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    const handleSilentLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth_logout', handleSilentLogout);
    return () => {
      window.removeEventListener('auth_logout', handleSilentLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('flowgenius_token', response.data.token);
    setUser(response.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('flowgenius_token', response.data.token);
    setUser(response.data.user);
  };

  const loginWithGoogle = async (token: string) => {
    const response = await api.post('/auth/google', { token });
    localStorage.setItem('flowgenius_token', response.data.token);
    setUser(response.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    localStorage.removeItem('flowgenius_token');
    setUser(null);
  };

  const updateProfileKeys = async (geminiApiKey: string) => {
    const response = await api.put('/users/profile', { geminiApiKey });
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateProfileKeys }}>
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
