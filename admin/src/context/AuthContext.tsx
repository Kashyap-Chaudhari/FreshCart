'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isOwner: boolean;
  isStaff: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isOwner: false,
  isStaff: false,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_admin_token') : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data && (res.data.role === 'OWNER' || res.data.role === 'STAFF')) {
        setUser(res.data);
      } else {
        localStorage.removeItem('freshcart_admin_token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('freshcart_admin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res.success && res.data?.token) {
      const u = res.data.user;
      if (u.role !== 'OWNER' && u.role !== 'STAFF') {
        return { success: false, message: 'Access denied: Only Store Owner and Staff can access this portal.' };
      }
      localStorage.setItem('freshcart_admin_token', res.data.token);
      setUser(u);
      return { success: true };
    }
    return { success: false, message: res.message || 'Invalid credentials' };
  };

  const logout = () => {
    localStorage.removeItem('freshcart_admin_token');
    setUser(null);
    router.push('/login');
  };

  const isOwner = user?.role === 'OWNER';
  const isStaff = user?.role === 'STAFF' || user?.role === 'OWNER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOwner,
        isStaff,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

