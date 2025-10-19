'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, Bell, Palette } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
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
      await updateProfile(formData);
      alert('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = () => {
    // In a real implementation, this would save to the backend
    alert('Preferencias de notificaciones guardadas');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder a la configuración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  El correo electrónico no se puede cambiar desde aquí
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phonePrefix">Prefijo</Label>
                  <Select
                    value={formData.phonePrefix}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phonePrefix: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+56">+56 (Chile)</SelectItem>
                      <SelectItem value="+54">+54 (Argentina)</SelectItem>
                      <SelectItem value="+51">+51 (Perú)</SelectItem>
                      <SelectItem value="+57">+57 (Colombia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="912345678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">País</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chile">Chile</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Perú">Perú</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moneda Preferida</Label>
                  <Select
                    value={formData.preferredCurrency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Correo Electrónico</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-events" className="flex-1">
                      Nuevos eventos y fases de venta
                    </Label>
                    <Switch
                      id="email-events"
                      checked={notifications.emailEvents}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailEvents: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-orders" className="flex-1">
                      Actualizaciones de órdenes
                    </Label>
                    <Switch
                      id="email-orders"
                      checked={notifications.emailOrders}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailOrders: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-tickets" className="flex-1">
                      Confirmaciones de tickets
                    </Label>
                    <Switch
                      id="email-tickets"
                      checked={notifications.emailTickets}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, emailTickets: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Notificaciones Push</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-events" className="flex-1">
                      Recordatorios de eventos
                    </Label>
                    <Switch
                      id="push-events"
                      checked={notifications.pushEvents}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, pushEvents: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-orders" className="flex-1">
                      Estado de órdenes
                    </Label>
                    <Switch
                      id="push-orders"
                      checked={notifications.pushOrders}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, pushOrders: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-tickets" className="flex-1">
                      Disponibilidad de tickets
                    </Label>
                    <Switch
                      id="push-tickets"
                      checked={notifications.pushTickets}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, pushTickets: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Métodos de Inicio de Sesión</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">Correo y contraseña</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activo</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">Google</span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {user.googleLinked ? 'Vinculado' : 'No vinculado'}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Cambiar Contraseña
              </Button>

              {!user.googleLinked && (
                <Button variant="outline" className="w-full">
                  Vincular Google
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Estas acciones no se pueden deshacer.
              </p>
              <Button variant="destructive" className="w-full">
                Eliminar Cuenta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}