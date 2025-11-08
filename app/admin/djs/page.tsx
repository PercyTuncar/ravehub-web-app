'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, EyeOff, Music, Star, Instagram, Globe, Calendar, Users, Award, Filter, CheckCircle, ExternalLink, Upload, Download, FileText, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox'; 
import { FileUpload } from '@/components/common/FileUpload';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj, Country } from '@/lib/types';
import { generateSlug } from '@/lib/utils/slug-generator';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

// Helper function to revalidate sitemap
async function revalidateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
    });
  } catch (error) {
    console.error('Error revalidating sitemap:', error);
  }
}

export default function DjManagementPage() {
  const router = useRouter();
  const [djs, setDjs] = useState<EventDj[]>([]);
  const [filteredDjs, setFilteredDjs] = useState<EventDj[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [selectedDj, setSelectedDj] = useState<EventDj | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  
  // Bulk upload states
  const [activeTab, setActiveTab] = useState<'djs' | 'bulk-upload'>('djs');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [duplicatesToHandle, setDuplicatesToHandle] = useState<any[]>([]);
  
  // Template download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  const [editForm, setEditForm] = useState<Partial<EventDj>>({
    name: '',
    description: '',
    bio: '',
    country: '',
    genres: [],
    instagramHandle: '',
    imageUrl: '',
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      spotify: '',
      tiktok: '',
      website: '',
    },
    famousTracks: [],
    famousAlbums: [],
    approved: false,
  });

  useEffect(() => {
    loadDjs();
    loadCountries();
  }, []);

  useEffect(() => {
    filterDjs();
  }, [djs, searchTerm, statusFilter, genreFilter]);

  const loadDjs = async () => {
    try {
      setLoading(true);
      const djData = await eventDjsCollection.getAll();
      setDjs(djData as EventDj[]);
    } catch (error) {
      console.error('Error loading DJs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await fetch('/api/locations/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const filterDjs = () => {
    let filtered = [...djs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(dj =>
        dj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dj.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dj.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dj.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'approved') {
      filtered = filtered.filter(dj => dj.approved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(dj => !dj.approved);
    }

    // Genre filter
    if (genreFilter !== 'all') {
      filtered = filtered.filter(dj => dj.genres.includes(genreFilter));
    }

    setFilteredDjs(filtered);
  };

  const handleEditDj = (dj: EventDj) => {
    setSelectedDj(dj);
    setEditForm({
      name: dj.name,
      description: dj.description,
      bio: dj.bio,
      country: dj.country,
      genres: dj.genres,
      instagramHandle: dj.instagramHandle,
      imageUrl: dj.imageUrl,
      socialLinks: dj.socialLinks,
      famousTracks: dj.famousTracks,
      famousAlbums: dj.famousAlbums,
      approved: dj.approved,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateDj = () => {
    setEditForm({
      name: '',
      description: '',
      bio: '',
      country: '',
      genres: [],
      instagramHandle: '',
      imageUrl: '',
      socialLinks: {
        instagram: '',
        facebook: '',
        twitter: '',
        youtube: '',
        spotify: '',
        tiktok: '',
        website: '',
      },
      famousTracks: [],
      famousAlbums: [],
      approved: false,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveDj = async (isEdit: boolean) => {
    try {
      let savedDjId;
      const djSlug = generateSlug(editForm.name || '');
      
      // Check for duplicates before saving (only for new DJs or when name/country changes)
      if (!isEdit || (editForm.name !== selectedDj?.name || editForm.country !== selectedDj?.country)) {
        const existingDjs = await eventDjsCollection.query([
          { field: 'name', operator: '==', value: editForm.name },
          { field: 'country', operator: '==', value: editForm.country }
        ]);
        
        // Filter out the current DJ if we're editing
        const duplicates = isEdit ?
          existingDjs.filter(dj => dj.id !== selectedDj?.id) :
          existingDjs;
          
        if (duplicates.length > 0) {
          const duplicate = duplicates[0];
          const confirmOverwrite = confirm(
            `⚠️ DJ DUPLICADO DETECTADO\n\n` +
            `Ya existe un DJ con el nombre "${editForm.name}" de ${editForm.country}.\n\n` +
            `DJ existente:\n` +
            `• Nombre: ${duplicate.name}\n` +
            `• País: ${duplicate.country}\n` +
            `• Slug: ${duplicate.slug}\n\n` +
            `¿Desea sobrescribir el DJ existente?`
          );
          
          if (!confirmOverwrite) {
            return; // User cancelled
          }
          
          // If overwriting, update the existing DJ instead of creating a new one
          if (duplicates.length > 0) {
            savedDjId = duplicate.id;
            await eventDjsCollection.update(duplicate.id, {
              ...editForm,
              slug: djSlug,
              updatedAt: new Date(),
            });
            
            // Generate schema and SEO data for the updated DJ
            try {
              const updatedDjData = { ...duplicate, ...editForm, slug: djSlug, id: savedDjId };
              const schema = SchemaGenerator.generate({
                type: 'dj',
                data: updatedDjData
              });
              
              await eventDjsCollection.update(savedDjId, {
                jsonLdSchema: schema,
                seoTitle: `${editForm.name} - DJ Profile | Ravehub`,
                seoDescription: editForm.description || `${editForm.name} is a professional DJ specializing in ${editForm.genres?.join(', ') || 'electronic music'}.`,
                seoKeywords: editForm.genres || [],
              });
              
              console.log('✅ Generated and saved JSONLD Schema for DJ (overwrite):', editForm.name);
            } catch (schemaError) {
              console.error('❌ Error generating DJ schema during overwrite:', schemaError);
            }
            
            setIsEditDialogOpen(false);
            setIsCreateDialogOpen(false);
            await loadDjs();
            
            // Revalidate sitemap when DJ is overwritten
            await revalidateSitemap();
            return;
          }
        }
      }
      
      if (isEdit && selectedDj) {
        savedDjId = selectedDj.id;
        await eventDjsCollection.update(selectedDj.id, {
          ...editForm,
          slug: djSlug,
          updatedAt: new Date(),
        });
      } else {
        const djData = {
          ...editForm,
          slug: djSlug,
          performerType: 'DJ',
          jobTitle: ['DJ', 'Music Producer'],
          birthDate: '',
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Omit<EventDj, 'id'>;
        
        savedDjId = await eventDjsCollection.create(djData);
      }

      // Generate JSONLD schema for the DJ and save it
      try {
        const djData = isEdit ?
          { ...selectedDj, ...editForm, slug: djSlug } :
          { ...editForm, slug: djSlug, id: savedDjId, createdAt: new Date(), updatedAt: new Date() };
          
        const schema = SchemaGenerator.generate({
          type: 'dj',
          data: djData
        });
        
        // Save the schema to the database
        await eventDjsCollection.update(savedDjId, {
          jsonLdSchema: schema,
          seoTitle: `${editForm.name} - DJ Profile | Ravehub`,
          seoDescription: editForm.description || `${editForm.name} is a professional DJ specializing in ${editForm.genres?.join(', ') || 'electronic music'}.`,
          seoKeywords: editForm.genres || [],
        });
        
        console.log('✅ Generated and saved JSONLD Schema for DJ:', editForm.name);
        
      } catch (schemaError) {
        console.error('❌ Error generating DJ schema:', schemaError);
        // Don't fail the entire operation if schema generation fails
      }

      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      await loadDjs();
      
      // Revalidate sitemap when DJ is created or updated
      await revalidateSitemap();
    } catch (error) {
      console.error('❌ Error saving DJ:', error);
    }
  };

  const handleDeleteDj = async (djId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este DJ?')) {
      try {
        await eventDjsCollection.delete(djId);
        await loadDjs();
        
        // Revalidate sitemap when DJ is deleted
        await revalidateSitemap();
      } catch (error) {
        console.error('Error deleting DJ:', error);
      }
    }
  };

  const handleToggleApproval = async (dj: EventDj) => {
    try {
      await eventDjsCollection.update(dj.id, {
        approved: !dj.approved,
      });
      await loadDjs();
      
      // Revalidate sitemap when DJ approval status changes (affects visibility in sitemap)
      await revalidateSitemap();
    } catch (error) {
      console.error('Error updating DJ approval:', error);
    }
  };

  const updateEditForm = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const addArrayItem = (field: 'genres' | 'famousTracks' | 'famousAlbums', value: string) => {
    if (value.trim()) {
      setEditForm(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'genres' | 'famousTracks' | 'famousAlbums', index: number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  // Bulk upload functions
  const downloadTemplate = useCallback(async () => {
    setIsDownloading(true);
    setDownloadStatus('Preparando plantilla...');
    
    try {
      // Multi-layer approach for template download
      let templateContent: string;
      let templateBlob: Blob;
      
      // Layer 1: Try direct API call
      try {
        setDownloadStatus('Intentando generar plantilla desde API...');
        const response = await fetch('/api/djs/template', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`API failed: ${response.status}`);
        }
        
        const data = await response.json();
        templateContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        
      } catch (apiError) {
        console.warn('❌ Template API failed, falling back to local generation:', apiError);
        setDownloadStatus('Generando plantilla localmente...');
        
        // Layer 2: Local generation with real examples
        // IMPORTANT: Generate array format, not object with property names
        const templateData = [
          {
            "name": "Martin Garrix", // Nombre artístico del DJ (obligatorio)
            "slug": "martin-garrix", // URL amigable del DJ, solo letras, números y guiones
            "description": "DJ y productor holandés líder en la escena electrónica, conocido por sus hits como 'Animals' y 'Scared to Be Lonely'", // Descripción breve para listados (máximo 160 caracteres)
            "bio": "Martin Garrix, cuyo nombre real es Martijn Gerard Garritsen, es un DJ y productor musical holandés nacido en 1996. Comenzó su carrera en la música electrónica a los 14 años y se convirtió en uno de los DJs más jóvenes y exitosos del mundo. Es conocido por sus tracks de electro house y progressive house, así como por sus colaboraciones con otros artistas de renombre. Ha ganado numerosos premios y ha sido nombrado varias veces en las listas de mejores DJs del mundo.", // Biografía completa para el perfil público
            "country": "Netherlands", // País de origen del DJ
            "genres": [
              "Progressive House", // Género principal del DJ (obligatorio)
              "Electro House",     // Género secundario
              "Big Room",          // Género adicional
              "Future House"       // Género adicional
            ],
            "jobTitle": [
              "DJ", // Títulos laborales del DJ (opcional)
              "Music Producer",    // Productor musical
              "Remixer",           // Remixer
              "Record Label Owner" // Dueño de sello discográfico
            ],
            "performerType": "DJ", // Tipo de performer (por defecto: DJ)
            "birthDate": "1996-05-14", // Fecha de nacimiento en formato YYYY-MM-DD (opcional)
            "alternateName": "Marten Garritsen", // Nombre alternativo o alias (opcional)
            "imageUrl": "https://example.com/martin-garrix.jpg", // URL válida de la imagen del DJ (obligatorio)
            "instagramHandle": "martingarrix", // Handle de Instagram (se extrae automáticamente de socialLinks.instagram, opcional)
            "socialLinks": {
              "instagram": "https://instagram.com/martingarrix", // Link obligatorio para extraer handle automáticamente
              "facebook": "https://facebook.com/MartinGarrix",   // Enlace a Facebook (opcional)
              "twitter": "https://twitter.com/MartinGarrix",     // Enlace a Twitter/X (opcional)
              "youtube": "https://youtube.com/c/MartinGarrix",   // Enlace a YouTube (opcional)
              "spotify": "https://open.spotify.com/artist/60nZcImufyMA1MKQY3dcCH", // Enlace a Spotify (opcional)
              "tiktok": "https://tiktok.com/@martingarrix",     // Enlace a TikTok (opcional)
              "website": "https://martingarrix.com"             // Sitio web oficial (opcional)
            },
            "famousTracks": [
              "Animals (2013)",      // Track famoso con año (mínimo 5 recomendados)
              "Scared to Be Lonely (2017)",  // Track famoso con año
              "Don't Look Down (2015)",      // Track famoso con año
              "Now I'm Fire (2014)",         // Track famoso con año
              "Wizard (2014)",               // Track famoso con año
              "Together (2018)",             // Track famoso con año
              "Drown (2019)",                // Track famoso con año
              "Millionaire (2020)"           // Track famoso con año
            ],
            "famousAlbums": [
              "Artemis (2020)",                    // Álbum famoso con año (mínimo 3 recomendados)
              "Seven (2023)",                      // Álbum famoso con año
              "Martin Garrix Collection (2019)",   // Álbum famoso con año
              "Break Through The Silence (2017)"   // Álbum famoso con año
            ],
            "approved": true, // true para visible públicamente, false para privado
            "createdBy": "admin-bulk-upload"
          },
          {
            "name": "David Guetta", // Nombre artístico del DJ (obligatorio)
            "slug": "david-guetta", // URL amigable del DJ, solo letras, números y guiones
            "description": "DJ y productor francés pionero de la música electrónica, creador de hits como 'Titanium' y 'Hey Mama'", // Descripción breve para listados (máximo 160 caracteres)
            "bio": "David Pierre Guetta es un DJ y productor musical francés nacido en 1967. Es considerado uno de los pioneros de la música house francesa y ha sido fundamental en el desarrollo del electro house. Ha trabajado con artistas de todos los géneros, desde Sia y Rihanna hasta Bebe Rexha y The黑kness. Ha ganado múltiples premios Grammy y es conocido por su capacidad para crear hits comerciales que mantienen la esencia underground de la música electrónica.", // Biografía completa para el perfil público
            "country": "France", // País de origen del DJ
            "genres": [
              "Electro House", // Género principal del DJ (obligatorio)
              "Progressive House", // Género secundario
              "Future House",      // Género adicional
              "Pop House"          // Género adicional
            ],
            "jobTitle": [
              "DJ", // Títulos laborales del DJ (opcional)
              "Music Producer",    // Productor musical
              "Remixer",           // Remixer
              "Record Producer"    // Productor discográfico
            ],
            "performerType": "DJ", // Tipo de performer (por defecto: DJ)
            "birthDate": "1967-11-07", // Fecha de nacimiento en formato YYYY-MM-DD (opcional)
            "alternateName": "David Guetta", // Nombre alternativo o alias (opcional)
            "imageUrl": "https://example.com/david-guetta.jpg", // URL válida de la imagen del DJ (obligatorio)
            "instagramHandle": "davidguetta", // Handle de Instagram (se extrae automáticamente de socialLinks.instagram, opcional)
            "socialLinks": {
              "instagram": "https://instagram.com/davidguetta", // Link obligatorio para extraer handle automáticamente
              "facebook": "https://facebook.com/DavidGuetta",   // Enlace a Facebook (opcional)
              "twitter": "https://twitter.com/davidguetta",     // Enlace a Twitter/X (opcional)
              "youtube": "https://youtube.com/user/DavidGuettaVEVO", // Enlace a YouTube (opcional)
              "spotify": "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypKndBYY", // Enlace a Spotify (opcional)
              "tiktok": "https://tiktok.com/@davidguetta",     // Enlace a TikTok (opcional)
              "website": "https://davidguetta.com"             // Sitio web oficial (opcional)
            },
            "famousTracks": [
              "Titanium (2011)",     // Track famoso con año (mínimo 5 recomendados)
              "Hey Mama (2014)",     // Track famoso con año
              "Without You (2011)",  // Track famoso con año
              "Play Hard (2012)",    // Track famoso con año
              "Memories (2019)",     // Track famoso con año
              "Don't Stop (2018)",   // Track famoso con año
              "Staying Up (2021)",   // Track famoso con año
              "Love Don't Let Me Go (2020)" // Track famoso con año
            ],
            "famousAlbums": [
              "Nothing But The Beat (2010)",    // Álbum famoso con año (mínimo 3 recomendados)
              "Listen (2014)",                  // Álbum famoso con año
              "7 (2018)",                       // Álbum famoso con año
              "The Guetta Experiment (2009)"    // Álbum famoso con año
            ],
            "approved": true, // true para visible públicamente, false para privado
            "createdBy": "admin-bulk-upload"
          },
          {
            // === DJ_EJEMPLO_3: Usa esta plantilla para agregar un DJ adicional ===
            "name": "", // Nombre artístico del DJ (obligatorio)
            "slug": "", // URL amigable del DJ (se genera automáticamente si se deja vacío)
            "description": "", // Descripción breve para listados (máximo 160 caracteres)
            "bio": "", // Biografía completa para el perfil público
            "country": "", // País de origen del DJ
            "genres": [], // Array de géneros musicales (mínimo 1, máximo 5)
            "jobTitle": ["DJ"], // Array de títulos laborales
            "performerType": "DJ", // Tipo de performer
            "birthDate": "", // Fecha de nacimiento en formato YYYY-MM-DD (opcional)
            "alternateName": "", // Nombre alternativo o alias (opcional)
            "imageUrl": "", // URL válida de la imagen del DJ (obligatorio)
            "instagramHandle": "", // Handle de Instagram (opcional)
            "socialLinks": {
              "instagram": "", // Link a Instagram (obligatorio para extraer handle)
              "facebook": "",  // Link a Facebook (opcional)
              "twitter": "",   // Link a Twitter/X (opcional)
              "youtube": "",   // Link a YouTube (opcional)
              "spotify": "",   // Link a Spotify (opcional)
              "tiktok": "",    // Link a TikTok (opcional)
              "website": ""    // Sitio web oficial (opcional)
            },
            "famousTracks": [], // Array de tracks famosos (mínimo 5 recomendados)
            "famousAlbums": [], // Array de álbumes famosos (mínimo 3 recomendados)
            "approved": false, // true para visible públicamente, false para privado
            "createdBy": "admin-bulk-upload"
          }
        ];
        
        // Convert to properly formatted JSON
        templateContent = JSON.stringify(templateData, null, 2);
        
        // Add instructions as separate documentation file reference
        const instructions = `
// === INSTRUCCIONES DE USO ===
// 1. Llena los campos obligatorios de cada DJ (name, description, bio, country, genres, imageUrl, approved)
// 2. Los campos opcionales se pueden dejar vacíos o completar según sea necesario
// 3. El slug se genera automáticamente si no se proporciona
// 4. El handle de Instagram se extrae automáticamente de socialLinks.instagram
// 5. Los géneros comunes incluyen: Progressive House, Electro House, Techno, House, Big Room, Future House, Trance, Dubstep, Drum & Bass, Pop House
// 6. Los países válidos incluyen: Netherlands, France, Argentina, United States, Germany, United Kingdom, Belgium, Brazil, Mexico, Spain
// 7. Los DJs duplicados se detectan por nombre y país
// 8. Una vez completados los campos, elimina estos comentarios y sube el archivo JSON

`;
        
        templateContent = instructions + templateContent;
      }

      setDownloadStatus('Creando archivo de descarga...');
      
      // Create and download the file
      templateBlob = new Blob([templateContent], {
        type: 'application/json;charset=utf-8'
      });
      
      const url = window.URL.createObjectURL(templateBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ravehub-djs-template-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      // Show success notification
      if ('Notification' in window) {
        new Notification('Plantilla descargada', {
          body: 'La plantilla JSON se ha descargado exitosamente. Lee las instrucciones incluidas.',
          icon: '/icons/logo.png'
        });
      }
      
      console.log('✅ Template downloaded successfully');
      
    } catch (error) {
      console.error('❌ Error downloading template:', error);
      
      // Final fallback: show manual instructions
      const errorMessage = `Error al descargar plantilla: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      setDownloadStatus(`Error: ${errorMessage}`);
      
      // Show alert
      alert(`❌ ${errorMessage}\n\nVerifica tu conexión a internet e intenta nuevamente.`);
    } finally {
      setIsDownloading(false);
      setDownloadStatus('');
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('Por favor, selecciona un archivo JSON válido.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResults(null);
      
      const fileContent = await file.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('El archivo JSON no es válido. Verifica la sintaxis.');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Send to bulk upload API
      const response = await fetch('/api/djs/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();
      setUploadResults(result);

      // Collect duplicates for handling
      const duplicates = result.results.filter((r: any) => r.duplicate && !r.success);
      setDuplicatesToHandle(duplicates);

      // Refresh DJ list if successful uploads
      if (result.summary.successful > 0) {
        await loadDjs();
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDuplicateAction = async (duplicateIndex: number, action: 'overwrite' | 'skip') => {
    const duplicate = duplicatesToHandle[duplicateIndex];
    if (!duplicate) {
      console.warn('❌ Duplicate not found in state');
      return;
    }

    try {
      if (action === 'overwrite') {
        console.log('🔄 Overwriting DJ:', duplicate.data.name);
        
        // Handle overwrite logic
        const updatedData = {
          ...duplicate.data,
          // Add overwrite flag to indicate this should overwrite existing DJ
          overwrite: true
        };
        
        const response = await fetch('/api/djs/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([updatedData]),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Check if the operation was successful
        if (result.results && result.results.length > 0) {
          const overwriteResult = result.results[0];
          
          // Update the specific result in uploadResults
          setUploadResults((prev: any) => {
            if (!prev) return prev;
            const updatedResults = [...prev.results];
            // Find the original result by DJ name to update it
            const originalIndex = updatedResults.findIndex((r: any) =>
              r.data?.name === duplicate.data?.name && r.data?.country === duplicate.data?.country
            );
            if (originalIndex !== -1) {
              updatedResults[originalIndex] = overwriteResult;
            }
            return { ...prev, results: updatedResults };
          });
        }
      }

      // Remove from duplicates to handle - use filter with index comparison
      setDuplicatesToHandle(prev => prev.filter((_, index) => index !== duplicateIndex));

      // Update summary
      setUploadResults((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            duplicates: Math.max(0, prev.summary.duplicates - 1),
            successful: prev.summary.successful + (action === 'overwrite' ? 1 : 0),
            failed: prev.summary.failed + (action === 'skip' ? 1 : 0)
          }
        };
      });

      // If this was the last duplicate, refresh the DJ list
      if (duplicatesToHandle.length === 1) {
        console.log('✅ All duplicates processed, refreshing DJ list...');
        await loadDjs();
      }

    } catch (error) {
      console.error('❌ Error handling duplicate:', error);
      alert(`Error procesando duplicado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));
    
    if (jsonFile) {
      handleFileUpload(jsonFile);
    } else {
      alert('Por favor, arrastra un archivo JSON válido.');
    }
  };

  // Extract Instagram handle from URL
  const extractInstagramHandle = (url: string): string | null => {
    if (!url) return null;
    
    // Handle different Instagram URL formats
    const patterns = [
      /instagram\.com\/([a-zA-Z0-9._]+)\/?$/,
      /instagram\.com\/([a-zA-Z0-9._]+)\/.*$/,
      /^@([a-zA-Z0-9._]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/^@/, ''); // Remove @ if present
      }
    }
    
    return null;
  };

  const allGenres = Array.from(new Set(djs.flatMap(dj => dj.genres))).sort();

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Gestión de DJs</h1>
            <p className="text-muted-foreground">Administra la base de datos de DJs y artistas</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="djs">Lista de DJs</TabsTrigger>
            <TabsTrigger value="bulk-upload">Carga Masiva</TabsTrigger>
          </TabsList>
          
          <TabsContent value="djs" className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total DJs</p>
                  <p className="text-2xl font-bold text-foreground">{djs.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold text-green-600">{djs.filter(dj => dj.approved).length}</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{djs.filter(dj => !dj.approved).length}</p>
                </div>
                <EyeOff className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Géneros</p>
                  <p className="text-2xl font-bold text-purple-600">{allGenres.length}</p>
                </div>
                <Music className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar DJs por nombre, género o país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="approved">Aprobados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los géneros</SelectItem>
                    {allGenres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Plantilla
                </Button>
                <Button onClick={() => setActiveTab('bulk-upload')} variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Carga Masiva
                </Button>
                <Button onClick={handleCreateDj} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo DJ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DJs List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando DJs...
            </div>
          ) : filteredDjs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron DJs con los filtros aplicados.
            </div>
          ) : (
            filteredDjs.map((dj) => (
              <Card key={dj.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {dj.imageUrl ? (
                        <img
                          src={dj.imageUrl}
                          alt={dj.name}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg ${dj.imageUrl ? 'hidden' : ''}`}>
                        {dj.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{dj.name}</h3>
                          <Badge variant={dj.approved ? "default" : "secondary"}>
                            {dj.approved ? "Aprobado" : "Pendiente"}
                          </Badge>
                          {dj.famousTracks.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {dj.famousTracks.length} tracks
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {dj.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {dj.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {dj.genres.join(', ')}
                          </span>
                          {dj.instagramHandle && (
                            <span className="flex items-center gap-1">
                              <Instagram className="h-3 w-3" />
                              @{dj.instagramHandle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleApproval(dj)}
                      >
                        {dj.approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/djs/${dj.slug}`, '_blank')}
                        disabled={!dj.approved}
                        title={dj.approved ? 'Ver perfil público' : 'Solo DJs aprobados pueden tener perfil público'}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDj(dj)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDj(dj.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="w-[95vw] max-w-7xl bg-card border-border shadow-2xl !h-auto max-h-[95vh] overflow-hidden p-0">
            <div className="flex flex-col max-h-[95vh]">
              {/* Enhanced Header */}
              <DialogHeader className="pb-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 px-8 py-6 flex-shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                      {isCreateDialogOpen ? 'Crear Nuevo DJ' : 'Editar DJ'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Complete toda la información del DJ para crear o actualizar su perfil profesional
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {isCreateDialogOpen ? 'Nuevo' : 'Edición'}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              {/* Content Area */}
              <div className="flex-1 overflow-hidden min-h-0">
                <Tabs defaultValue="basic" className="h-full flex flex-col">
                  <div className="px-6 pt-6 pb-4 bg-muted/20 flex-shrink-0">
                    <TabsList className="grid w-full grid-cols-4 bg-background/80 backdrop-blur border border-border/50 shadow-sm p-1">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-sm bg-current opacity-60"></div>
                          Información Básica
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="music"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Música
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="social"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Redes Sociales
                        </div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="schema"
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-medium text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-sm bg-current opacity-60"></div>
                          Vista Previa Schema
                        </div>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 px-6 py-6">
                    <TabsContent value="basic" className="space-y-8 mt-0">
                      {/* Form Field Grid - Enhanced Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            Nombre del DJ *
                          </Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => {
                              updateEditForm('name', e.target.value);
                              // Auto-generate slug when name changes
                              const slug = generateSlug(e.target.value);
                              setEditForm(prev => ({ ...prev, slug }));
                            }}
                            placeholder="Nombre artístico del DJ"
                            className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 h-12 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="slug" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            URL/Slug *
                          </Label>
                          <Input
                            id="slug"
                            value={editForm.slug || generateSlug(editForm.name || '')}
                            onChange={(e) => {
                              const cleanSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                              updateEditForm('slug', cleanSlug);
                            }}
                            placeholder="url-del-dj"
                            className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 h-12 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="country" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            País *
                          </Label>
                          <Combobox
                            options={countries.map(country => ({
                              value: country.name,
                              label: country.name,
                              flag: country.flag
                            }))}
                            value={editForm.country}
                            onValueChange={(value) => updateEditForm('country', value)}
                            placeholder="Seleccionar país"
                            searchPlaceholder="Buscar país..."
                          />
                        </div>
                      </div>

                      {/* Enhanced Image Section */}
                      <div className="bg-gradient-to-br from-muted/20 to-background rounded-xl p-8 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <Music className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <Label className="text-base font-semibold text-foreground">Imagen del DJ</Label>
                            <p className="text-xs text-muted-foreground mt-1">Recomendado: 500x500px • Formatos: JPG, PNG, WebP • Máximo: 5MB</p>
                          </div>
                        </div>

                        {/* Upload Method Toggle */}
                        <div className="space-y-6">
                          {(() => {
                            const currentUrl = editForm.imageUrl || '';
                            const isUploadMode = !currentUrl || currentUrl.includes('firebase') || currentUrl.startsWith('https://firebasestorage');
                            
                            return (
                              <>
                                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl border border-border/50 w-fit">
                                  <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                      isUploadMode
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      if (!isUploadMode) {
                                        updateEditForm('imageUrl', '');
                                      }
                                    }}
                                  >
                                    📁 Subir Archivo
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                      !isUploadMode
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                    onClick={() => {
                                      updateEditForm('imageUrl', '');
                                    }}
                                  >
                                    🔗 Usar URL
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  {/* Upload Section */}
                                  <div className={`space-y-3 ${!isUploadMode ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                                      <FileUpload
                                        onUploadComplete={(url: string) => updateEditForm('imageUrl', url)}
                                        currentUrl={isUploadMode ? currentUrl : undefined}
                                        onClear={() => updateEditForm('imageUrl', '')}
                                        accept="image/jpeg,image/png,image/webp"
                                        maxSize={5}
                                        folder="djs/images"
                                        variant="default"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* URL Section */}
                                  <div className={`space-y-3 ${isUploadMode ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Label className="text-sm font-medium text-foreground">URL de la Imagen</Label>
                                    <Input
                                      type="url"
                                      value={!isUploadMode ? currentUrl : ''}
                                      onChange={(e) => updateEditForm('imageUrl', e.target.value)}
                                      placeholder="https://example.com/dj-image.jpg"
                                      className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Si ya tienes la imagen en un servidor externo
                                    </p>
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          {editForm.imageUrl && (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-green-800 dark:text-green-200">Vista Previa de la Imagen</span>
                              </div>
                              <div className="bg-background border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-sm">
                                <img
                                  src={editForm.imageUrl}
                                  alt={editForm.name || 'Imagen del DJ'}
                                  className="w-full h-48 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                                🚀 La imagen se optimizará automáticamente para web
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description Fields - Enhanced */}
                      <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="description" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Descripción Corta
                          </Label>
                          <Textarea
                            id="description"
                            value={editForm.description}
                            onChange={(e) => updateEditForm('description', e.target.value)}
                            placeholder="Descripción breve del DJ para mostrar en listados"
                            rows={3}
                            className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground resize-none shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="bio" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Biografía Completa
                          </Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => updateEditForm('bio', e.target.value)}
                            placeholder="Biografía detallada del DJ, su carrera, logros y estilo musical"
                            rows={6}
                            className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground resize-none shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Géneros Musicales
                          </Label>
                          <div className="flex gap-3">
                            <Input
                              placeholder="Agregar género (presiona Enter)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addArrayItem('genres', e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {editForm.genres?.map((genre, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 bg-muted text-muted-foreground border border-border px-3 py-1"
                                onClick={() => removeArrayItem('genres', index)}
                              >
                                {genre} ×
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Approval Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="approved"
                                checked={editForm.approved}
                                onChange={(e) => updateEditForm('approved', e.target.checked)}
                                className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/20 focus:ring-2 transition-all duration-200"
                              />
                              <Label htmlFor="approved" className="text-base font-semibold text-foreground cursor-pointer">
                                Aprobar DJ
                              </Label>
                              <Badge variant={editForm.approved ? "default" : "secondary"}>
                                {editForm.approved ? "Visible" : "Oculto"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Los DJs aprobados aparecerán en las búsquedas públicas y listados de eventos
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="music" className="space-y-8 mt-0">
                      <div className="grid grid-cols-1 gap-8">
                        {/* Famous Tracks */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-8 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                              <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <Label className="text-base font-semibold text-foreground">Tracks Famosos</Label>
                              <p className="text-xs text-muted-foreground mt-1">Las canciones más conocidas del DJ</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Input
                              placeholder="Agregar track famoso (presiona Enter)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addArrayItem('famousTracks', e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm"
                            />
                            <div className="space-y-3">
                              {editForm.famousTracks?.map((track, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-border/50 hover:bg-muted/70 transition-all duration-200 group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                      <Music className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{track}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeArrayItem('famousTracks', index)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Famous Albums */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-8 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                              <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <Label className="text-base font-semibold text-foreground">Álbumes Famosos</Label>
                              <p className="text-xs text-muted-foreground mt-1">Los álbumes más reconocidos del DJ</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Input
                              placeholder="Agregar álbum famoso (presiona Enter)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addArrayItem('famousAlbums', e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm"
                            />
                            <div className="space-y-3">
                              {editForm.famousAlbums?.map((album, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-border/50 hover:bg-muted/70 transition-all duration-200 group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                      <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{album}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeArrayItem('famousAlbums', index)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-8 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Social Media Fields */}
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-pink-500" />
                            Instagram
                          </Label>
                          <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.instagram || ''}
                              onChange={(e) => {
                                updateSocialLink('instagram', e.target.value);
                                // Auto-extract Instagram handle from URL
                                const handle = extractInstagramHandle(e.target.value);
                                if (handle) {
                                  updateEditForm('instagramHandle', handle);
                                }
                              }}
                              placeholder="https://instagram.com/username"
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                          {/* Show extracted handle */}
                          {editForm.instagramHandle && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                Handle extraído: @{editForm.instagramHandle}
                              </span>
                            </div>
                          )}
                          {/* Validation error */}
                          {editForm.socialLinks?.instagram && !editForm.instagramHandle && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                URL de Instagram inválida o formato no soportado
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            Facebook
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.facebook || ''}
                              onChange={(e) => updateSocialLink('facebook', e.target.value)}
                              placeholder="https://facebook.com/..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Globe className="w-4 h-4 text-sky-500" />
                            Twitter
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.twitter || ''}
                              onChange={(e) => updateSocialLink('twitter', e.target.value)}
                              placeholder="https://twitter.com/..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Globe className="w-4 h-4 text-red-500" />
                            YouTube
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.youtube || ''}
                              onChange={(e) => updateSocialLink('youtube', e.target.value)}
                              placeholder="https://youtube.com/..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Music className="w-4 h-4 text-green-500" />
                            Spotify
                          </Label>
                          <div className="relative">
                            <Music className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.spotify || ''}
                              onChange={(e) => updateSocialLink('spotify', e.target.value)}
                              placeholder="https://spotify.com/artist/..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Globe className="w-4 h-4 text-black" />
                            TikTok
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.tiktok || ''}
                              onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                              placeholder="https://tiktok.com/@..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            Sitio Web
                          </Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={editForm.socialLinks?.website || ''}
                              onChange={(e) => updateSocialLink('website', e.target.value)}
                              placeholder="https://..."
                              className="pl-10 bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="schema" className="space-y-8 mt-0">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-8 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-sm"></div>
                          </div>
                          <div>
                            <Label className="text-base font-semibold text-foreground">Vista Previa del Schema JSONLD</Label>
                            <p className="text-xs text-muted-foreground mt-1">Así se verá el schema de datos estructurados para este DJ</p>
                          </div>
                        </div>
                        
                        {(() => {
                          try {
                            // Generate real-time schema preview
                            const previewData = {
                              ...editForm,
                              slug: generateSlug(editForm.name || ''),
                              id: selectedDj?.id || 'preview-id',
                              createdAt: selectedDj?.createdAt || new Date(),
                              updatedAt: new Date(),
                              upcomingEvents: selectedDj?.upcomingEvents || [],
                              pastEvents: selectedDj?.pastEvents || [],
                            };
                            
                            const schema = SchemaGenerator.generate({
                              type: 'dj',
                              data: previewData
                            });
                            
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                      Schema generado exitosamente
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                                      // You could add a toast notification here
                                    }}
                                  >
                                    Copiar JSON
                                  </Button>
                                </div>
                                
                                <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-auto">
                                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(schema, null, 2)}
                                  </pre>
                                </div>
                                
                                {/* Schema validation indicators */}
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${schema['@graph']?.find((node: any) => node['@type'] === 'Person') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-muted-foreground">ProfilePage: {schema['@graph']?.find((node: any) => node['@type'] === 'ProfilePage') ? '✅' : '❌'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${schema['@graph']?.find((node: any) => node['@type'] === 'Person') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-muted-foreground">Person (DJ): {schema['@graph']?.find((node: any) => node['@type'] === 'Person') ? '✅' : '❌'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${(schema['@graph']?.filter((node: any) => node['@type'] === 'MusicRecording')?.length || 0) > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <span className="text-muted-foreground">Tracks ({schema['@graph']?.filter((node: any) => node['@type'] === 'MusicRecording')?.length || 0})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${(schema['@graph']?.filter((node: any) => node['@type'] === 'MusicAlbum')?.length || 0) > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                    <span className="text-muted-foreground">Albums ({schema['@graph']?.filter((node: any) => node['@type'] === 'MusicAlbum')?.length || 0})</span>
                                  </div>
                                </div>
                              </div>
                            );
                          } catch (error) {
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                    Error generando schema
                                  </span>
                                </div>
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                  <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                                    {error instanceof Error ? error.message : 'Error desconocido'}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Enhanced Modal Footer */}
              <div className="border-t border-border/50 bg-gradient-to-r from-muted/20 to-background px-8 py-6 flex justify-between items-center flex-shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-6 py-3 h-auto min-h-[44px] transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSaveDj(isEditDialogOpen)}
                  disabled={!editForm.name || !editForm.country}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium px-8 py-3 h-auto min-h-[44px] shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isEditDialogOpen ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Actualizar DJ
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crear DJ
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </TabsContent>
          
          <TabsContent value="bulk-upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Carga Masiva de DJs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Download */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Plantilla de DJ</h3>
                      <p className="text-sm text-muted-foreground">
                        Descarga la plantilla JSON para agregar múltiples DJs de una vez
                      </p>
                    </div>
                    <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Descargar Plantilla
                    </Button>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/20'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Arrastra tu archivo JSON aquí
                      </h3>
                      <p className="text-muted-foreground">
                        o haz clic para seleccionar un archivo
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file);
                        };
                        input.click();
                      }}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Seleccionar Archivo JSON
                    </Button>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Procesando archivo...</span>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Results */}
                {uploadResults && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Resumen de Carga</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Exitosos: {uploadResults.summary.successful}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span>Duplicados: {uploadResults.summary.duplicates}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span>Fallidos: {uploadResults.summary.failed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Total: {uploadResults.summary.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Results Table */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Resultados Detallados</h4>
                      <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                        {uploadResults.results.map((result: any, index: number) => (
                          <div
                            key={index}
                            className={`p-4 border-b border-border last:border-b-0 ${
                              result.success ? 'bg-green-50 dark:bg-green-950/20' :
                              result.duplicate ? 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-400' :
                              'bg-red-50 dark:bg-red-950/20'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {result.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : result.duplicate ? (
                                  <AlertCircle className="h-4 w-4 text-orange-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">
                                      {result.data?.name || 'Sin nombre'}
                                    </span>
                                    {result.duplicate && (
                                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700">
                                        🔄 DUPLICADO
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1">
                                    {result.duplicate ? (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                          ⚠️ Ya existe en la base de datos
                                        </p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400">
                                          {result.error || `DJ "${result.data?.name}" de ${result.data?.country} ya existe`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          • Opciones: <button
                                            onClick={() => {
                                              const duplicateIndex = duplicatesToHandle.findIndex(d =>
                                                d.data?.name === result.data?.name &&
                                                d.data?.country === result.data?.country
                                              );
                                              if (duplicateIndex !== -1) {
                                                handleDuplicateAction(duplicateIndex, 'overwrite');
                                              } else {
                                                console.warn('❌ Duplicate not found for overwrite action');
                                              }
                                            }}
                                            className="text-blue-600 hover:underline font-medium"
                                          >
                                            Sobrescribir
                                          </button> |
                                          <button
                                            onClick={() => {
                                              const duplicateIndex = duplicatesToHandle.findIndex(d =>
                                                d.data?.name === result.data?.name &&
                                                d.data?.country === result.data?.country
                                              );
                                              if (duplicateIndex !== -1) {
                                                handleDuplicateAction(duplicateIndex, 'skip');
                                              } else {
                                                console.warn('❌ Duplicate not found for skip action');
                                              }
                                            }}
                                            className="text-gray-600 hover:underline font-medium ml-1"
                                          >
                                            Saltar
                                          </button>
                                        </p>
                                      </div>
                                    ) : result.success ? (
                                      <p className="text-xs text-green-700 dark:text-green-300">
                                        ✅ DJ agregado exitosamente
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                          ❌ Error de validación
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400">
                                          {result.error || 'Verificar campos obligatorios'}
                                        </p>
                                        {result.validationErrors && result.validationErrors.length > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            {result.validationErrors.slice(0, 2).map((err: any, errIndex: number) => (
                                              <div key={errIndex}>
                                                • {err.message}
                                              </div>
                                            ))}
                                            {result.validationErrors.length > 2 && (
                                              <div>• ... y {result.validationErrors.length - 2} más</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                <div>{result.data?.country || 'Sin país'}</div>
                                {result.data?.genres && result.data.genres.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {result.data.genres.slice(0, 2).join(', ')}
                                    {result.data.genres.length > 2 && '...'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Duplicates handling buttons */}
                            {result.duplicate && duplicatesToHandle.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      // Find the duplicate in duplicatesToHandle array
                                      const duplicateIndex = duplicatesToHandle.findIndex(d =>
                                        d.data?.name === result.data?.name &&
                                        d.data?.country === result.data?.country
                                      );
                                      if (duplicateIndex !== -1) {
                                        handleDuplicateAction(duplicateIndex, 'overwrite');
                                      } else {
                                        console.warn('❌ Duplicate not found for overwrite action');
                                      }
                                    }}
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                  >
                                    🔄 Sobrescribir existente
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      // Find the duplicate in duplicatesToHandle array
                                      const duplicateIndex = duplicatesToHandle.findIndex(d =>
                                        d.data?.name === result.data?.name &&
                                        d.data?.country === result.data?.country
                                      );
                                      if (duplicateIndex !== -1) {
                                        handleDuplicateAction(duplicateIndex, 'skip');
                                      } else {
                                        console.warn('❌ Duplicate not found for skip action');
                                      }
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    ⏭️ Saltar
                                  </Button>
                                </div>
                                {duplicatesToHandle.length > 1 && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    {duplicatesToHandle.length} duplicados restantes por procesar
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}