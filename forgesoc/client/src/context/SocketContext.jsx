import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null); // { severity, title } for the live alert banner

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('alert:new', (alert) => {
      setToast({ kind: 'alert', severity: alert.severity, title: `New alert: ${alert.title}` });
    });
    socket.on('ip:blocked', (entry) => {
      setToast({ kind: 'block', severity: 'HIGH', title: `IP blocked: ${entry.ip}` });
    });
    socket.on('incident:new', (incident) => {
      setToast({ kind: 'incident', severity: incident.severity, title: `Incident opened: ${incident.title}` });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, toast, dismissToast: () => setToast(null) }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
