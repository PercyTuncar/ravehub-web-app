'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, Bell, Palette, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    phonePrefix: user?.phonePrefix || '+56',
    country: user?.country || 'Chile',
    preferredCurrency: user?.preferredCurrency || 'CLP',
  });

  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailOrders: true,
    emailTickets: true,
    pushEvents: false,
    pushOrders: false,
    pushTickets: false,
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(formData);
      // Optional: Add toast notification here
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNotifications = () => {
    // In a real implementation, this would save to the backend
    console.log('Preferencias de notificaciones guardadas');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141618]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Acceso requerido</h1>
          <p className="text-white/60 mb-6">Debes iniciar sesión para configurar tu perfil.</p>
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
            'radial-gradient(circle at 85% 15%, rgba(251,169,5,0.08), transparent 40%), radial-gradient(circle at 15% 85%, rgba(0,203,255,0.06), transparent 40%)'
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <Link href="/profile" className="group">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-white hover:bg-white/10 border border-white/5">
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
            <p className="text-white/60">Gestiona tu información personal y preferencias de cuenta</p>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Left Column: Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

            {/* Personal Info Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">Información Personal</h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">Nombre</label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">Apellido</label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/70 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={user.email}
                      disabled
                      className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white/50 cursor-not-allowed font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] uppercase font-bold text-green-400">
                      Verificado
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 ml-1">El correo electrónico no se puede cambiar por seguridad.</p>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">Prefijo</label>
                    <div className="relative">
                      <select
                        name="phonePrefix"
                        value={formData.phonePrefix}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                      >
                        <option value="+56" className="bg-[#1A1D21]">+56 CL</option>
                        <option value="+54" className="bg-[#1A1D21]">+54 AR</option>
                        <option value="+51" className="bg-[#1A1D21]">+51 PE</option>
                        <option value="+57" className="bg-[#1A1D21]">+57 CO</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="9 1234 5678"
                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">País</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-8 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                      >
                        <option value="Chile" className="bg-[#1A1D21]">Chile</option>
                        <option value="Argentina" className="bg-[#1A1D21]">Argentina</option>
                        <option value="Perú" className="bg-[#1A1D21]">Perú</option>
                        <option value="Colombia" className="bg-[#1A1D21]">Colombia</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/70 ml-1">Moneda Preferida</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 font-bold flex items-center justify-center">$</div>
                      <select
                        name="preferredCurrency"
                        value={formData.preferredCurrency}
                        onChange={handleInputChange}
                        className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-8 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                      >
                        <option value="CLP" className="bg-[#1A1D21]">CLP - Peso Chileno</option>
                        <option value="USD" className="bg-[#1A1D21]">USD - Dólar Americano</option>
                        <option value="EUR" className="bg-[#1A1D21]">EUR - Euro</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-white font-medium px-8 min-w-[140px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Notificaciones</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Correo Electrónico</h4>
                  {[
                    { id: 'emailEvents', label: 'Nuevos eventos y line-ups', checked: notifications.emailEvents },
                    { id: 'emailOrders', label: 'Estado de mis órdenes y compras', checked: notifications.emailOrders },
                    { id: 'emailTickets', label: 'Recordatorios de mis tickets', checked: notifications.emailTickets }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                      <label htmlFor={item.id} className="text-sm text-white/80 cursor-pointer flex-1">{item.label}</label>
                      <Switch
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.id]: checked }))}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Notificaciones Push</h4>
                  {[
                    { id: 'pushEvents', label: 'Alertas de eventos flash', checked: notifications.pushEvents },
                    { id: 'pushOrders', label: 'Actualización en tiempo real', checked: notifications.pushOrders }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                      <label htmlFor={item.id} className="text-sm text-white/80 cursor-pointer flex-1">{item.label}</label>
                      <Switch
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.id]: checked }))}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white font-medium"
                  >
                    Guardar Preferencias
                  </Button>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Sidebar */}
          <motion.div variants={itemVariants} className="space-y-6">

            {/* Theme Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Apariencia</h3>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-white/60">Tema de la aplicación</label>
                <div className="grid grid-cols-3 gap-2">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t as any)}
                      className={`h-9 rounded-lg text-xs font-medium border transition-all ${theme === t
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-black/20 border-white/5 text-white/60 hover:bg-black/40'
                        }`}
                    >
                      {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Auto'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Seguridad</h3>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">Email</span>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20">ACTIVO</span>
                </div>

                <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /></svg>
                    <span className="text-sm text-white/80">Google</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${user.googleLinked
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
                      : 'bg-white/5 text-white/40 border-white/5'
                    }`}>
                    {user.googleLinked ? 'VINCULADO' : 'NO VINCULADO'}
                  </span>
                </div>

                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 bg-transparent h-9 text-xs">
                  Cambiar Contraseña
                </Button>

                {!user.googleLinked && (
                  <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 bg-transparent h-9 text-xs">
                    Vincular Google
                  </Button>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 backdrop-blur-md border border-red-500/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-red-500 mb-2">Zona de Peligro</h3>
              <p className="text-xs text-red-400/60 mb-4">Eliminar tu cuenta borrará todos tus datos permanentemente.</p>
              <Button variant="destructive" className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-9 text-xs">
                Eliminar Cuenta
              </Button>
            </div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}