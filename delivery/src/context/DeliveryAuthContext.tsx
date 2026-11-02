'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface DeliveryPersonUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'DELIVERY_PERSON';
  vehicleNumber?: string;
  vehicleType?: string;
  isActive: boolean;
}

interface DeliveryAuthContextType {
  deliveryPerson: DeliveryPersonUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const DeliveryAuthContext = createContext<DeliveryAuthContextType>({
  deliveryPerson: null,
  token: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshProfile: async () => {},
});

function getApiBaseUrls(): string[] {
  const rawEnvUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const cleanUrl = rawEnvUrl.replace(/\/+$/, '');
  const envUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === '127.0.0.1') {
      return ['http://127.0.0.1:5000/api', envUrl, 'http://localhost:5000/api'];
    }
  }
  return [envUrl, 'http://localhost:5000/api', 'http://127.0.0.1:5000/api'];
}

export function DeliveryAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPersonUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('freshcart_delivery_token');
    localStorage.removeItem('freshcart_delivery_user');
    setDeliveryPerson(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('freshcart_delivery_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    const candidateUrls = Array.from(new Set(getApiBaseUrls()));
    for (const baseUrl of candidateUrls) {
      try {
        const res = await fetch(`${baseUrl}/delivery/profile`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.user) {
          setDeliveryPerson(data.data.user);
          setToken(savedToken);
          localStorage.setItem('freshcart_delivery_user', JSON.stringify(data.data.user));
          setLoading(false);
          return;
        }
      } catch {
        // Continue to fallback url
      }
    }

    const cached = localStorage.getItem('freshcart_delivery_user');
    if (cached) {
      setDeliveryPerson(JSON.parse(cached));
      setToken(savedToken);
    } else {
      logout();
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (identifier: string, password: string) => {
    const candidateUrls = Array.from(new Set(getApiBaseUrls()));
    let lastError = 'Network error connecting to delivery server';

    for (const baseUrl of candidateUrls) {
      try {
        const res = await fetch(`${baseUrl}/delivery/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.token) {
          localStorage.setItem('freshcart_delivery_token', data.token);
          localStorage.setItem('freshcart_delivery_user', JSON.stringify(data.deliveryPerson));
          setToken(data.token);
          setDeliveryPerson(data.deliveryPerson);
          return { success: true };
        } else {
          return { success: false, message: data.message || 'Login failed' };
        }
      } catch (err: any) {
        lastError = err.message || 'Failed to connect to backend server';
      }
    }

    return {
      success: false,
      message: `${lastError}. Please check that backend is running on port 5000.`,
    };
  };

  return (
    <DeliveryAuthContext.Provider
      value={{
        deliveryPerson,
        token,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth() {
  return useContext(DeliveryAuthContext);
}

