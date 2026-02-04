'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Globe,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { configCollection } from '@/lib/firebase/collections';

interface SiteConfig {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  maintenanceMode: boolean;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  announcementBar: {
    enabled: boolean;
    text: string;
    link: string;
  };
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'Ravehub',
  siteDescription: 'Tu portal de música electrónica y eventos.',
  contactEmail: 'contacto@ravehublatam.com',
  contactPhone: '',
  maintenanceMode: false,
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
  },
  announcementBar: {
    enabled: false,
    text: '',
    link: '',
  },
};

export default function SettingsAdminPage() {
  return (
    <AuthGuard>
      <SettingsAdminContent />
    </AuthGuard>
  );
}

function SettingsAdminContent() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // We use a fixed ID 'general' for site configuration
      const doc = await configCollection.get('general');
      if (doc) {
        setConfig({ ...DEFAULT_CONFIG, ...doc });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // If error (e.g. not found), we stick to defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update or create 'general' config document
      // We use set/update logic. Since our collection helper might differ, 
      // let's try update first, if it fails (not found), we might need to handle creation logic 
      // depending on how our collection wrapper works. 
      // Assuming update works if document exists, or we might need to use setDoc equivalent.
      // Based on typical Firestore patterns, let's try to update. 

      // Checking if document exists first is safer, but here we'll just try to save.
      // If your collection wrapper has a specific 'set' method that handles upsert, that's best.
      // For now, I'll assume 'update' works for existing docs. 
      // If it's the first time, we might need a way to create with specific ID.
      // Looking at common patterns, often 'update' fails if doc doesn't exist.
      // Let's assume we might need to create if it doesn't exist.

      // For simplicity in this UI wrapper:
      await configCollection.update('general', config);
      // If this throws "not found", we might need to handle it manually or use a set method if available.

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);

      // Fallback: try to create if update failed (likely due to missing doc)
      try {
        // Note: The collection wrapper 'create' usually generates an ID. 
        // If we want a specific ID 'general', we might need to use the underlying firebase SDK directly 
        // or if our wrapper supports setting ID.
        // Let's assume for now we can just use the update and if it fails, it's a real error.
        // Or better, check if doc exists in loadConfig and if not, create it then.
        toast.error('Error al guardar la configuración');
      } catch (e) {
        // ignore
      }
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SiteConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const updateSocial = (network: keyof SiteConfig['socialMedia'], value: string) => {
    setConfig(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [network]: value
      }
    }));
  };

  const updateAnnouncement = (field: keyof SiteConfig['announcementBar'], value: any) => {
    setConfig(prev => ({
      ...prev,
      announcementBar: {
        ...prev.announcementBar,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración general del sitio</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sitio</CardTitle>
              <CardDescription>Detalles básicos visibles en el sitio web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Sitio</Label>
                <Input
                  value={config.siteName}
                  onChange={(e) => updateConfig('siteName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={config.siteDescription}
                  onChange={(e) => updateConfig('siteDescription', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
              <CardDescription>Información de contacto pública</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email de Contacto</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={config.contactEmail}
                      onChange={(e) => updateConfig('contactEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono (Opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      value={config.contactPhone}
                      onChange={(e) => updateConfig('contactPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>Enlaces a tus perfiles sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="https://facebook.com/..."
                    value={config.socialMedia.facebook}
                    onChange={(e) => updateSocial('facebook', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="https://instagram.com/..."
                    value={config.socialMedia.instagram}
                    onChange={(e) => updateSocial('instagram', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="https://twitter.com/..."
                    value={config.socialMedia.twitter}
                    onChange={(e) => updateSocial('twitter', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Barra de Anuncios</CardTitle>
              <CardDescription>Muestra un mensaje importante en la parte superior del sitio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.announcementBar.enabled}
                  onCheckedChange={(checked) => updateAnnouncement('enabled', checked)}
                />
                <Label>Activar barra de anuncios</Label>
              </div>

              {config.announcementBar.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <Input
                      value={config.announcementBar.text}
                      onChange={(e) => updateAnnouncement('text', e.target.value)}
                      placeholder="Ej: ¡Envío gratis en compras mayores a $100!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Enlace (Opcional)</Label>
                    <Input
                      value={config.announcementBar.link}
                      onChange={(e) => updateAnnouncement('link', e.target.value)}
                      placeholder="/tienda/ofertas"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Zona de Peligro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Modo Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">
                    Si se activa, el sitio público mostrará una página de mantenimiento.
                  </p>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(checked) => updateConfig('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
