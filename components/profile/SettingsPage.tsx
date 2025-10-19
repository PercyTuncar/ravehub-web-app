'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, MapPin, Shield, Bell, Palette, Globe } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'CL',
    preferredCurrency: user?.preferredCurrency || 'CLP',
    documentType: user?.documentType || 'rut',
    documentNumber: user?.documentNumber || '',
  });

  const [notifications, setNotifications] = useState({
    emailEvents: true,
    emailOrders: true,
    emailPromotions: false,
    pushEvents: true,
    pushOrders: true,
  });

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      // TODO: Update profile API
      console.log('Updating profile:', profileData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    try {
      // TODO: Update notifications API
      console.log('Updating notifications:', notifications);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Acceso requerido</h2>
        <p className="text-muted-foreground">Debes iniciar sesión para acceder a la configuración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL} alt={user.firstName} />
                  <AvatarFallback className="text-lg">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Cambiar Foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o GIF. Máx 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="country">País</Label>
                  <Select value={profileData.country} onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CL">Chile</SelectItem>
                      <SelectItem value="AR">Argentina</SelectItem>
                      <SelectItem value="BR">Brasil</SelectItem>
                      <SelectItem value="MX">México</SelectItem>
                      <SelectItem value="CO">Colombia</SelectItem>
                      <SelectItem value="PE">Perú</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Moneda Preferida</Label>
                  <Select value={profileData.preferredCurrency} onValueChange={(value) => setProfileData(prev => ({ ...prev, preferredCurrency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
                      <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                      <SelectItem value="BRL">BRL - Real Brasileño</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="PEN">PEN - Sol Peruano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentType">Tipo Documento</Label>
                  <Select value={profileData.documentType} onValueChange={(value: 'rut' | 'dni' | 'passport') => setProfileData(prev => ({ ...prev, documentType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rut">RUT</SelectItem>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={profileData.documentNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, documentNumber: e.target.value }))}
                />
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving} className="w-full md:w-auto">
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Nuevos eventos por email</Label>
                    <p className="text-xs text-muted-foreground">Recibe notificaciones de nuevos eventos</p>
                  </div>
                  <Switch
                    checked={notifications.emailEvents}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailEvents: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Actualizaciones de pedidos por email</Label>
                    <p className="text-xs text-muted-foreground">Estado de tus órdenes y envíos</p>
                  </div>
                  <Switch
                    checked={notifications.emailOrders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailOrders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Promociones y ofertas</Label>
                    <p className="text-xs text-muted-foreground">Descuentos y ofertas especiales</p>
                  </div>
                  <Switch
                    checked={notifications.emailPromotions}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailPromotions: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Notificaciones push de eventos</Label>
                    <p className="text-xs text-muted-foreground">Recordatorios de eventos favoritos</p>
                  </div>
                  <Switch
                    checked={notifications.pushEvents}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushEvents: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Notificaciones push de pedidos</Label>
                    <p className="text-xs text-muted-foreground">Actualizaciones de envío</p>
                  </div>
                  <Switch
                    checked={notifications.pushOrders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushOrders: checked }))}
                  />
                </div>
              </div>

              <Button onClick={handleNotificationUpdate} disabled={saving} variant="outline" className="w-full md:w-auto">
                {saving ? 'Guardando...' : 'Guardar Preferencias'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tema</Label>
                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
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
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Cambiar Contraseña
              </Button>
              <Button variant="outline" className="w-full">
                Vincular Google
              </Button>
              <Button variant="destructive" className="w-full">
                Eliminar Cuenta
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID de usuario:</span>
                <span className="font-mono text-xs">{user.id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email verificado:</span>
                <span>{user.emailVerified ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proveedor:</span>
                <span>{user.authProvider || 'Email'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rol:</span>
                <span className="capitalize">{user.role || 'Usuario'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}