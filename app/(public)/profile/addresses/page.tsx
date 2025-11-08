'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usersCollection } from '@/lib/firebase/collections';
import { Address } from '@/lib/types';
import { getCountries, getStatesByCountry, CountryData, StateData } from '@/lib/utils/location-apis';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    country: '',
    region: '',
    city: '',
    address: '',
    postalCode: '',
    additionalInfo: '',
    isDefault: false,
  });

  // Location data
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    loadCountries();
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadCountries = async () => {
    const countriesData = await getCountries();
    setCountries(countriesData);
  };

  const loadStates = async (countryCode: string) => {
    setLoadingLocations(true);
    const statesData = await getStatesByCountry(countryCode);
    setStates(statesData);
    setLoadingLocations(false);
  };

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const userData = await usersCollection.get(user.id);
      if (userData && userData.addresses) {
        setAddresses(userData.addresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        fullName: address.fullName,
        phone: address.phone,
        country: address.country,
        region: address.region,
        city: address.city,
        address: address.address,
        postalCode: address.postalCode,
        additionalInfo: address.additionalInfo || '',
        isDefault: address.isDefault,
      });
      // Load states for the country
      const country = countries.find(c => c.name === address.country);
      if (country) {
        loadStates(country.code);
      }
    } else {
      setEditingAddress(null);
      setFormData({
        fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
        phone: user?.phone || '',
        country: '',
        region: '',
        city: '',
        address: '',
        postalCode: '',
        additionalInfo: '',
        isDefault: addresses.length === 0, // Primera dirección es default
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let updatedAddresses = [...addresses];

      if (editingAddress) {
        // Editar dirección existente
        updatedAddresses = updatedAddresses.map(addr =>
          addr.id === editingAddress.id
            ? { ...addr, ...formData, id: addr.id, createdAt: addr.createdAt }
            : addr
        );
      } else {
        // Crear nueva dirección
        const newAddress: Address = {
          id: `addr_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
        };
        updatedAddresses.push(newAddress);
      }

      // Si esta dirección es default, quitar default de las demás
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === (editingAddress?.id || updatedAddresses[updatedAddresses.length - 1].id),
        }));
      }

      // Actualizar en Firebase
      await usersCollection.update(user.id, { addresses: updatedAddresses });

      setAddresses(updatedAddresses);
      setIsDialogOpen(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error al guardar la dirección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);

      // Si eliminamos la dirección default y hay otras, hacer la primera default
      const deletedWasDefault = addresses.find(a => a.id === addressId)?.isDefault;
      if (deletedWasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      await usersCollection.update(user.id, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));

      await usersCollection.update(user.id, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Error al establecer dirección predeterminada');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Direcciones</h1>
          <p className="text-muted-foreground">Gestiona tus direcciones de envío</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Dirección
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No tienes direcciones guardadas</h2>
            <p className="text-muted-foreground mb-6">
              Agrega una dirección para agilizar tus compras
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Dirección
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className={`relative ${address.isDefault ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{address.fullName}</CardTitle>
                  {address.isDefault && (
                    <Badge className="bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Predeterminada
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Teléfono:</p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Dirección:</p>
                  <p className="text-sm text-muted-foreground">{address.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.region}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.country} - {address.postalCode}
                  </p>
                </div>
                {address.additionalInfo && (
                  <div>
                    <p className="text-sm font-medium">Información adicional:</p>
                    <p className="text-sm text-muted-foreground">{address.additionalInfo}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Predeterminada
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={address.isDefault ? 'flex-1' : ''}
                    onClick={() => handleOpenDialog(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para agregar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+51 987 654 321"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>País *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    const country = countries.find(c => c.name === value);
                    setFormData({ ...formData, country: value, region: '', city: '' });
                    if (country) {
                      loadStates(country.code);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Región/Estado *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                  disabled={!formData.country || loadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona región" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Ciudad *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lima"
                />
              </div>
              <div>
                <Label>Código Postal *</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="15001"
                />
              </div>
            </div>

            <div>
              <Label>Dirección Completa *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Av. Javier Prado 123, Dpto 401"
              />
            </div>

            <div>
              <Label>Información Adicional (Opcional)</Label>
              <Textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                placeholder="Referencias, instrucciones de entrega, etc."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Establecer como dirección predeterminada
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={saving || !formData.fullName || !formData.phone || !formData.country || !formData.region || !formData.city || !formData.address || !formData.postalCode}
                className="flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar Dirección'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


