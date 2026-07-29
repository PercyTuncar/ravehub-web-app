'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, CheckCheck, Package, CreditCard, Truck, Info, Trash2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/lib/contexts/NotificationsContext';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

function parseDate(createdAt: any): Date {
  if (!createdAt) return new Date();
  if (createdAt instanceof Date) return createdAt;
  if (typeof createdAt === 'string') {
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof createdAt === 'object' && 'toDate' in createdAt) return createdAt.toDate();
  if (typeof createdAt === 'object' && 'seconds' in createdAt) return new Date(createdAt.seconds * 1000);
  return new Date();
}

function getIcon(type: Notification['type']) {
  switch (type) {
    case 'order':   return <Package className="w-5 h-5" />;
    case 'payment': return <CreditCard className="w-5 h-5" />;
    case 'shipping':return <Truck className="w-5 h-5" />;
    default:        return <Info className="w-5 h-5" />;
  }
}

function getIconColor(type: Notification['type']) {
  switch (type) {
    case 'order':   return 'bg-blue-500/15 text-blue-400';
    case 'payment': return 'bg-primary/15 text-primary';
    case 'shipping':return 'bg-purple-500/15 text-purple-400';
    default:        return 'bg-white/10 text-white/60';
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteNotification(id);
    toast.success('Notificación eliminada');
    setDeletingId(null);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('Todas marcadas como leídas');
  };

  const getNotificationLink = (n: Notification) => {
    if (!n.orderId) return null;
    return n.type === 'payment' ? `/profile/tickets/${n.orderId}` : `/profile/orders`;
  };

  return (
    <div className="min-h-screen bg-[#141618] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#141618] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificaciones
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-white/50">{unreadCount} sin leer</p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-0 flex gap-1">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === f
                  ? 'border-primary text-primary'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {f === 'all' ? 'Todas' : 'Sin leer'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/50 font-medium">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((notif) => {
              const date = parseDate(notif.createdAt);
              const link = getNotificationLink(notif);
              return (
                <div
                  key={notif.id}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    notif.read
                      ? 'bg-white/3 border-white/5'
                      : 'bg-white/7 border-primary/20 shadow-sm shadow-primary/5'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColor(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-tight ${notif.read ? 'text-white/60' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${notif.read ? 'text-white/40' : 'text-white/70'}`}>
                      {notif.body}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/30">
                        {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                      </span>
                      <span className="text-white/10">·</span>
                      <span className="text-xs text-white/30">
                        {format(date, 'dd MMM, HH:mm', { locale: es })}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-3">
                      {link && (
                        <Link href={link}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-white/10 text-white/60 hover:text-white hover:bg-white/5 px-3"
                            onClick={() => !notif.read && markAsRead(notif.id)}
                          >
                            <Ticket className="w-3 h-3 mr-1.5" />
                            Ver {notif.type === 'payment' ? 'ticket' : 'pedido'}
                          </Button>
                        </Link>
                      )}
                      {!notif.read && (
                        <button
                          className="text-xs text-white/30 hover:text-primary transition-colors flex items-center gap-1"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <Check className="w-3 h-3" />
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    disabled={deletingId === notif.id}
                    onClick={() => handleDelete(notif.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                    title="Eliminar"
                  >
                    {deletingId === notif.id
                      ? <span className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

