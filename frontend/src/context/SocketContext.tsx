'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinOrderRoom: () => {},
  leaveOrderRoom: () => {},
});

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const activeRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_token') : null;

    const socketInstance = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Re-join any active rooms after reconnect
      activeRoomsRef.current.forEach((orderId) => {
        socketInstance.emit('join_order_room', orderId);
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const joinOrderRoom = useCallback(
    (orderId: string) => {
      if (!orderId) return;
      activeRoomsRef.current.add(orderId);
      if (socket && socket.connected) {
        socket.emit('join_order_room', orderId);
      }
    },
    [socket]
  );

  const leaveOrderRoom = useCallback(
    (orderId: string) => {
      if (!orderId) return;
      activeRoomsRef.current.delete(orderId);
      if (socket && socket.connected) {
        socket.emit('leave_order_room', orderId);
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

