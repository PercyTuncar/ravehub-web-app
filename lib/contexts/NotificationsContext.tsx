'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationsCollection } from '@/lib/firebase/collections';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'payment' | 'shipping' | 'general';
  orderId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Poll for new notifications every 5 minutes (300000ms) instead of 30s to reduce reads
      // Better yet: use onSnapshot for real-time updates if supported, but for now increasing interval is safer
      const interval = setInterval(loadNotifications, 300000);
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const userNotifications = await notificationsCollection.query(
        [{ field: 'userId', operator: '==', value: user.id }],
        'createdAt',
        'desc'
      );
      
      // Normalize createdAt to ISO string format
      const normalizedNotifications = userNotifications.map((notif: any) => {
        let createdAt = notif.createdAt;
        
        // Handle Firestore Timestamp
        if (createdAt && typeof createdAt === 'object') {
          if ('toDate' in createdAt) {
            createdAt = createdAt.toDate().toISOString();
          } else if ('seconds' in createdAt) {
            createdAt = new Date(createdAt.seconds * 1000).toISOString();
          } else if (createdAt instanceof Date) {
            createdAt = createdAt.toISOString();
          }
        }
        
        return {
          ...notif,
          createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
        };
      });
      
      setNotifications(normalizedNotifications as Notification[]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsCollection.update(notificationId, { read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => notificationsCollection.update(n.id, { read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsCollection.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const refreshNotifications = async () => {
    setLoading(true);
    await loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}


