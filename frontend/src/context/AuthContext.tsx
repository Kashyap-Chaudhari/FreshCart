'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
  addresses?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtpAndLogin: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isOwner: boolean;
  isStaff: boolean;
  isAdmin: boolean; // Owner or Staff
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('freshcart_token');
    if (savedToken) {
      setToken(savedToken);
      api
        .getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const saveAuthSession = (authToken: string, authUser: User) => {
    localStorage.setItem('freshcart_token', authToken);
    setToken(authToken);
    setUser(authUser);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.success && res.data) {
      saveAuthSession(res.data.token, res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const verifyOtpAndLogin = async (phone: string, otp: string, name?: string) => {
    const res = await api.verifyOtp({ phone, otp, name });
    if (res.success && res.data) {
      saveAuthSession(res.data.token, res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Verification failed' };
  };

  const registerUser = async (data: any) => {
    const res = await api.register(data);
    if (res.success && res.data) {
      saveAuthSession(res.data.token, res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('freshcart_token');
    setToken(null);
    setUser(null);
  };

  const isOwner = user?.role === 'OWNER';
  const isStaff = user?.role === 'STAFF';
  const isAdmin = isOwner || isStaff;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithEmail,
        verifyOtpAndLogin,
        registerUser,
        logout,
        isOwner,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
