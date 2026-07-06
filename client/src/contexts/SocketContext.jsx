import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io('http://localhost:3001', {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    // Invalidate relevant caches on CRUD events
    const entityMap = {
      projects: 'projects', tasks: 'tasks', documents: 'documents',
      approvals: 'approvals', site_reports: 'site-reports',
      announcements: 'announcements', messages: 'messages',
    };

    s.on('entity:created', ({ table }) => {
      const key = entityMap[table] || table;
      queryClient.invalidateQueries({ queryKey: [key] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });
    s.on('entity:updated', ({ table }) => {
      const key = entityMap[table] || table;
      queryClient.invalidateQueries({ queryKey: [key] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });
    s.on('entity:deleted', ({ table }) => {
      const key = entityMap[table] || table;
      queryClient.invalidateQueries({ queryKey: [key] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });
    s.on('file:shared', () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    });

    setSocket(s);
    return () => { s.disconnect(); setSocket(null); setConnected(false); };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
