'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Ticket, ShoppingBag, Settings, Heart, Calendar, MapPin, Mail, Phone, LogOut, ChevronRight, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfileClient() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  // Mock data - unchanged logic
  const userStats = {
    totalTickets: 5,
    totalOrders: 2,
    favoriteEvents: 8,
    joinedDate: '2024-01-15',
  };

  const recentTickets = [
    {
      id: '1',
      eventName: 'Ultra Chile 2026',
      eventDate: '2026-03-14',
      status: 'approved',
      ticketsCount: 2,
      totalAmount: 110000,
      currency: 'CLP',
      image: '/images/events/ultra.jpg' // Placeholder
    },
  ];

  const recentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      status: 'delivered',
      totalAmount: 45000,
      currency: 'CLP',
      itemsCount: 2,
      orderDate: '2024-12-01',
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-white/60 mb-6">Debes iniciar sesión para ver tu perfil.</p>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90 text-white">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'tickets', label: 'Mis Tickets', icon: Ticket },
    { id: 'orders', label: 'Mis Órdenes', icon: ShoppingBag },
    { id: 'favorites', label: 'Favoritos', icon: Heart },
  ];

  return (
    <div className="min-h-screen relative bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Dynamic Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#141618]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(251,169,5,0.1), transparent 40%), radial-gradient(circle at 85% 85%, rgba(0,203,255,0.08), transparent 40%)'
        }}
      />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Mi Perfil</h1>
            <p className="text-white/60">Gestiona tu cuenta, revisa tus entradas y sigue tus eventos.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full md:w-auto border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-red-400 transition-colors gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 w-full max-w-full">

          {/* Sidebar / User Info */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 w-full">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-600" />

              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  <Avatar className="h-24 w-24 border-2 border-primary/20 relative z-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.firstName} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-[#141618] rounded-full z-20" title="Activo" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-white/40 text-sm mb-6 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> {user.email}
                </p>

                <div className="w-full space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center text-sm text-white/70">
                    <MapPin className="w-4 h-4 mr-3 text-primary opacity-70" />
                    {user.country || 'Sin ubicación'}
                  </div>
                  {user.phone && (
                    <div className="flex items-center text-sm text-white/70">
                      <Phone className="w-4 h-4 mr-3 text-primary opacity-70" />
                      +{user.phonePrefix} {user.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-white/70">
                    <Calendar className="w-4 h-4 mr-3 text-primary opacity-70" />
                    Miembro desde {new Date(userStats.joinedDate).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                  </div>
                </div>

                <Link href="/profile/settings" className="w-full mt-4 block">
                  <Button variant="ghost" className="w-full text-white/50 hover:text-white hover:bg-white/5 group-hover:text-primary transition-colors">
                    <Settings className="w-4 h-4 mr-2" /> Editar Perfil
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                Estadísticas
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">{userStats.totalTickets}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Tickets</div>
                </div>
                <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">{userStats.totalOrders}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Órdenes</div>
                </div>
                <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">{userStats.favoriteEvents}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Favoritos</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div variants={itemVariants} className="lg:col-span-8 w-full min-w-0">
            {/* Custom Tabs Navigation */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-none max-w-full">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border whitespace-nowrap ${isActive
                      ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_-5px_var(--primary)]'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white">Próximos Eventos</h3>
                    </div>
                    {/* Placeholder for functionality */}
                    <div className="bg-black/20 rounded-xl border border-white/5 p-8 text-center">
                      <Calendar className="w-12 h-12 text-white/10 mx-auto mb-3" />
                      <p className="text-white/40">No tienes eventos próximos programados.</p>
                      <Button variant="link" className="text-primary mt-2">Explorar eventos</Button>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Actividad Reciente</h3>
                    <div className="space-y-3">
                      {recentTickets.length > 0 ? recentTickets.map((ticket) => (
                        <div key={ticket.id} className="group bg-black/20 hover:bg-black/30 border border-white/5 rounded-xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                              <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium group-hover:text-primary transition-colors">{ticket.eventName}</h4>
                              <p className="text-white/40 text-sm">{new Date(ticket.eventDate).toLocaleDateString('es-CL')} • {ticket.ticketsCount} tickets</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20 self-start sm:self-center">Aprobado</Badge>
                        </div>
                      )) : <p className="text-white/40">Sin actividad reciente</p>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Mis Tickets</h3>
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="group bg-black/20 border border-white/5 rounded-xl p-5 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                              <Ticket className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-lg">{ticket.eventName}</h4>
                              <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(ticket.eventDate).toLocaleDateString('es-CL')}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span>{ticket.ticketsCount} tickets</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                            <div className="text-left md:text-right md:mr-4">
                              <p className="text-white/40 text-xs uppercase tracking-wider">Total</p>
                              <p className="text-white font-bold">${ticket.totalAmount.toLocaleString()} {ticket.currency}</p>
                            </div>
                            <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10">
                              Ver detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Historial de Órdenes</h3>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-primary/20 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-start gap-4">
                            <div className="mt-1 bg-white/5 p-2 rounded-lg shrink-0">
                              <ShoppingBag className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-semibold">Orden #{order.orderNumber}</h4>
                                <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px] h-5">Entregado</Badge>
                              </div>
                              <p className="text-white/40 text-sm">
                                {new Date(order.orderDate).toLocaleDateString('es-CL')} • {order.itemsCount} productos
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <p className="text-white font-medium">${order.totalAmount.toLocaleString()} {order.currency}</p>
                            <Button size="icon" variant="ghost" className="text-white/40 hover:text-white">
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Aún no tienes favoritos</h3>
                  <p className="text-white/40 max-w-sm mb-6">Explora los próximos eventos y guarda los que más te interesen para recibir notificaciones.</p>
                  <Link href="/">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      Explorar Eventos
                    </Button>
                  </Link>
                </div>
              )}

            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}