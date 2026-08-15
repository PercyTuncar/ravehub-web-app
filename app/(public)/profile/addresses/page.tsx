'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, MapPin, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

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
        isDefault: addresses.length === 0,
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
        updatedAddresses = updatedAddresses.map(addr =>
          addr.id === editingAddress.id
            ? { ...addr, ...formData, id: addr.id, createdAt: addr.createdAt }
            : addr
        );
      } else {
        const newAddress: Address = {
          id: `addr_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
        };
        updatedAddresses.push(newAddress);
      }

      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: addr.id === (editingAddress?.id || updatedAddresses[updatedAddresses.length - 1].id),
        }));
      }

      await usersCollection.update(user.id, { addresses: updatedAddresses });

      setAddresses(updatedAddresses);
      setIsDialogOpen(false);
      setEditingAddress(null);
      toast.success('Dirección guardada correctamente');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar la dirección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);

      const deletedWasDefault = addresses.find(a => a.id === addressId)?.isDefault;
      if (deletedWasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }

      await usersCollection.update(user.id, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      toast.success('Dirección eliminada');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar la dirección');
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
      toast.success('Dirección predeterminada actualizada');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Error al establecer dirección predeterminada');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141618] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(0,203,255,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(251,169,5,0.1), transparent 40%)' }}
      />

      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Mis Direcciones</h1>
            <p className="text-white/60 text-sm mt-1">Gestiona tus direcciones de envío</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No tienes direcciones guardadas</h2>
            <p className="text-white/40 mb-8">Agrega una dirección para agilizar tus compras</p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Dirección
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white/5 backdrop-blur-md border rounded-2xl p-6 hover:border-white/20 transition-all ${
                  address.isDefault ? 'border-primary/50 ring-1 ring-primary/30' : 'border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">{address.fullName}</h3>
                  {address.isDefault && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      <Check className="h-3 w-3 mr-1" />
                      Predeterminada
                    </Badge>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-white/40 uppercase text-xs mb-1">Teléfono</p>
                    <p className="text-white/80">{address.phone}</p>
                  </div>
                  <div>
                    <p className="text-white/40 uppercase text-xs mb-1">Dirección</p>
                    <p className="text-white/80">{address.address}</p>
                    <p className="text-white/60">{address.city}, {address.region}</p>
                    <p className="text-white/60">{address.country} - {address.postalCode}</p>
                  </div>
                  {address.additionalInfo && (
                    <div>
                      <p className="text-white/40 uppercase text-xs mb-1">Info adicional</p>
                      <p className="text-white/60">{address.additionalInfo}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t border-white/10">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Hacer predeterminada
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-white/5 border-white/10 text-white hover:bg-white/10 ${address.isDefault ? 'flex-1' : ''}`}
                    onClick={() => handleOpenDialog(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Nombre completo</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">País</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, country: value, region: '' });
                    const country = countries.find(c => c.name === value);
                    if (country) loadStates(country.code);
                  }}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Selecciona país" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/70">Región/Estado</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                  disabled={!formData.country || loadingLocations}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Selecciona región" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                    {states.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Ciudad</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Código Postal</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Dirección completa</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle, número, depto/casa, etc."
                className="bg-black/20 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/70">Información adicional (opcional)</Label>
              <Textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                placeholder="Referencias, indicaciones, etc."
                className="bg-black/20 border-white/10 text-white resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-black/20"
              />
              <Label htmlFor="isDefault" className="text-white/70 cursor-pointer">
                Establecer como dirección predeterminada
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAddress}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Dirección'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
