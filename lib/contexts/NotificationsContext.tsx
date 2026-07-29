'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

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
  refreshNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/** Normalize any createdAt shape (Timestamp, { seconds }, ISO string, Date) to ISO string */
function normalizeDate(createdAt: any): string {
  if (!createdAt) return new Date().toISOString();
  if (typeof createdAt === 'string') return createdAt;
  if (createdAt instanceof Date) return createdAt.toISOString();
  if (typeof createdAt === 'object' && 'toDate' in createdAt) return createdAt.toDate().toISOString();
  if (typeof createdAt === 'object' && 'seconds' in createdAt) return new Date(createdAt.seconds * 1000).toISOString();
  return new Date().toISOString();
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener — fires immediately with current data, then on every change.
    // No polling needed: new notifications from the server (Admin SDK writes) appear
    // in the client as soon as Firestore propagates the write (~1-2 seconds).
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            ...(data as Omit<Notification, 'id' | 'createdAt'>),
            id: docSnap.id,
            createdAt: normalizeDate(data.createdAt),
          } as Notification;
        });
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Error in notifications listener:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      // onSnapshot will update state automatically; optimistic update for instant UI
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(
        unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // With onSnapshot, a manual refresh is a no-op (data is always live).
  // Kept in the API for backwards compatibility.
  const refreshNotifications = () => { /* onSnapshot keeps data current */ };

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

