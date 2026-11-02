'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface OrderAlert {
  id: string;
  orderNumber: string;
  customerName: string;
  grandTotal: number;
  message: string;
  timestamp: string;
  type: 'NEW_ORDER' | 'CANCEL_REQUEST' | 'STATUS_CHANGE' | 'DELIVERY_COMPLETED' | 'DELIVERY_FAILED';
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeAlert: OrderAlert | null;
  dismissAlert: () => void;
  playAlertChime: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeAlert: null,
  dismissAlert: () => {},
  playAlertChime: () => {},
});

const rawSocketApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_SERVER_URL = rawSocketApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') || 'http://localhost:5000';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlert, setActiveAlert] = useState<OrderAlert | null>(null);

  // Play a pleasant synthesizer notification sound via Web Audio API (Zero external audio file needed)
  const playAlertChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();

      // Pleasant multi-tone chime (E5 -> G#5 -> B5)
      const playTone = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + delay + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      };

      playTone(659.25, 0.0); // E5
      playTone(830.61, 0.12); // G#5
      playTone(987.77, 0.24); // B5
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_admin_token') : null;

    const socketInstance = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join_admin_room');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-Time Incoming Order Event
    socketInstance.on('new_order', (data: any) => {
      const order = data.order || data;
      playAlertChime();

      setActiveAlert({
        id: order.id || `alert-${Date.now()}`,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        grandTotal: Number(order.grandTotal),
        message: data.message || `New Order #${order.orderNumber} received!`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'NEW_ORDER',
      });
    });

    // Real-Time Cancellation Request Event
    socketInstance.on('cancellation_requested', (data: any) => {
      playAlertChime();

      setActiveAlert({
        id: `cancel-${Date.now()}`,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        grandTotal: Number(data.order?.grandTotal || 0),
        message: `Customer requested cancellation for #${data.orderNumber}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'CANCEL_REQUEST',
      });
    });

    // Real-Time Delivery Completed Event (Requirement 4)
    socketInstance.on('delivery_completed', (data: any) => {
      playAlertChime();

      setActiveAlert({
        id: `deliv-${Date.now()}`,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        grandTotal: Number(data.grandTotal || 0),
        message: data.message || `Order #${data.orderNumber} successfully delivered by ${data.deliveryPersonName}`,
        timestamp: data.timeStr || new Date().toLocaleTimeString(),
        type: 'DELIVERY_COMPLETED',
      });
    });

    // Real-Time Delivery Failed Event
    socketInstance.on('delivery_failed', (data: any) => {
      playAlertChime();

      setActiveAlert({
        id: `fail-${Date.now()}`,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        grandTotal: Number(data.grandTotal || 0),
        message: data.message || `Delivery failed for #${data.orderNumber}`,
        timestamp: data.timeStr || new Date().toLocaleTimeString(),
        type: 'DELIVERY_FAILED',
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, playAlertChime]);

  const dismissAlert = () => setActiveAlert(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeAlert,
        dismissAlert,
        playAlertChime,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

