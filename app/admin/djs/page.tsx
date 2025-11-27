'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, EyeOff, Music, Star, Instagram, Globe, Calendar, Users, Award, Filter, CheckCircle, ExternalLink, Upload, Download, FileText, AlertCircle, CheckCircle2, XCircle, Loader2, Share2, Image, X } from 'lucide-react';
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
import { DJSocialPreview } from '@/components/seo/DJSocialPreview';

// Helper function to revalidate sitemap (only on server-side or when API is available)
async function revalidateSitemap() {
  // Only attempt revalidation if we're on the server or if the API route is available
  if (typeof window === 'undefined') {
    // Server-side: skip client-side fetch
    return;
  }

  try {
    // Check if we're in a browser environment and API is available
    const baseUrl = window.location.origin;
    const token = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';

    // Use a timeout to avoid hanging if API is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path: '/sitemap.xml' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    // Silently fail - revalidation is not critical for the user experience
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sitemap revalidation skipped (API may not be available):', error);
    }
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

  const [imageAspectRatioWarning, setImageAspectRatioWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editForm.imageUrl) {
      const img = document.createElement('img');
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 1) > 0.05) { // Allow small margin of error (5%)
          setImageAspectRatioWarning('⚠️ La imagen no es cuadrada (1:1). Se recomienda usar una imagen cuadrada para asegurar la mejor visualización en Google y redes sociales.');
        } else {
          setImageAspectRatioWarning(null);
        }
      };
      img.onerror = () => {
        // Ignore error or handle it
      };
      img.src = editForm.imageUrl;
    } else {
      setImageAspectRatioWarning(null);
    }
  }, [editForm.imageUrl]);

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

  const handleCreateDj = () => {
    setSelectedDj(null);
    setEditForm({
      name: '',
      alternateName: '',
      description: '',
      bio: '',
      country: '',
      genres: [],
      jobTitle: ['DJ', 'Music Producer'],
      performerType: 'DJ',
      birthDate: '',
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
      seoTitle: '',
      seoDescription: '',
      seoKeywords: [],
      coverImage: '',
      galleryImages: [],
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditDj = (dj: EventDj) => {
    setSelectedDj(dj);
    setEditForm({
      name: dj.name,
      alternateName: dj.alternateName || '',
      description: dj.description,
      bio: dj.bio,
      country: dj.country,
      genres: dj.genres,
      jobTitle: dj.jobTitle || ['DJ', 'Music Producer'],
      performerType: dj.performerType || 'DJ',
      birthDate: dj.birthDate || '',
      instagramHandle: dj.instagramHandle,
      imageUrl: dj.imageUrl,
      coverImage: dj.coverImage || '',
      galleryImages: dj.galleryImages || [],
      socialLinks: {
        instagram: dj.socialLinks?.instagram || '',
        facebook: dj.socialLinks?.facebook || '',
        twitter: dj.socialLinks?.twitter || '',
        youtube: dj.socialLinks?.youtube || '',
        spotify: dj.socialLinks?.spotify || '',
        tiktok: dj.socialLinks?.tiktok || '',
        website: dj.socialLinks?.website || '',
      },
      famousTracks: dj.famousTracks || [],
      famousAlbums: dj.famousAlbums || [],
      approved: dj.approved,
      seoTitle: dj.seoTitle || dj.name,
      seoDescription: dj.seoDescription || dj.description,
      seoKeywords: dj.seoKeywords || dj.genres,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveDj = async () => {
    try {
      let savedDjId: string;

      // Ensure SEO fields are populated if empty
      const seoTitle = editForm.seoTitle || editForm.name || '';
      const seoDescription = editForm.seoDescription || editForm.description || '';
      const seoKeywords = (editForm.seoKeywords && editForm.seoKeywords.length > 0) 
        ? editForm.seoKeywords 
        : (editForm.genres || []);

      const djDataToSave = {
        ...editForm,
        slug: generateSlug(editForm.name || ''),
        seoTitle,
        seoDescription,
        seoKeywords,
        updatedAt: new Date(),
      };

      if (selectedDj) {
        // Edit existing DJ
        savedDjId = selectedDj.id;
        await eventDjsCollection.update(selectedDj.id, djDataToSave);
      } else {
        // Create new DJ
        const newDjData = {
          ...djDataToSave,
          performerType: editForm.performerType || 'DJ',
          jobTitle: editForm.jobTitle || ['DJ', 'Music Producer'],
          birthDate: editForm.birthDate || '',
          createdBy: 'admin',
          createdAt: new Date(),
        } as Omit<EventDj, 'id'>;

        savedDjId = await eventDjsCollection.create(newDjData);
      }

      // Generate JSONLD schema for the DJ and save it
      try {
        const djData = selectedDj ?
          { ...selectedDj, ...djDataToSave } :
          { ...djDataToSave, id: savedDjId, createdAt: new Date() };

        // Generate schema using the updated generator
        const schema = SchemaGenerator.generate({
          type: 'dj',
          data: djData
        });

        // Save the schema to the database
        await eventDjsCollection.update(savedDjId, {
          jsonLdSchema: schema
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

  const addArrayItem = (field: 'genres' | 'famousTracks' | 'famousAlbums' | 'galleryImages', value: string) => {
    if (value.trim()) {
      setEditForm(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'genres' | 'famousTracks' | 'famousAlbums' | 'galleryImages', index: number) => {
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
                        <Button onClick={handleSaveDj} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Guardar DJ
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateDialogOpen(false);
                            setIsEditDialogOpen(false);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto p-0">
                    <Tabs defaultValue="general" className="w-full h-full flex flex-col">
                      <div className="px-8 pt-6 pb-2 border-b border-border bg-muted/10">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="general">Información General</TabsTrigger>
                          <TabsTrigger value="media">Multimedia y Redes</TabsTrigger>
                          <TabsTrigger value="seo">SEO y Vista Previa</TabsTrigger>
                        </TabsList>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8">
                        <TabsContent value="general" className="mt-0 space-y-6">
                          {/* Basic Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nombre del DJ *</Label>
                              <Input
                                id="name"
                                value={editForm.name || ''}
                                onChange={(e) => updateEditForm('name', e.target.value)}
                                placeholder="Ej: Martin Garrix"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="alternateName">Nombre Real / Alternativo</Label>
                              <Input
                                id="alternateName"
                                value={editForm.alternateName || ''}
                                onChange={(e) => updateEditForm('alternateName', e.target.value)}
                                placeholder="Ej: Martijn Gerard Garritsen"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="country">País *</Label>
                              <Select
                                value={editForm.country || ''}
                                onValueChange={(value) => updateEditForm('country', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un país" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map(country => (
                                    <SelectItem key={country.code} value={country.name}>
                                      {country.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                              <Input
                                id="birthDate"
                                type="date"
                                value={editForm.birthDate || ''}
                                onChange={(e) => updateEditForm('birthDate', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Descripción breve *</Label>
                            <Textarea
                              id="description"
                              value={editForm.description || ''}
                              onChange={(e) => updateEditForm('description', e.target.value)}
                              placeholder="Descripción corta para listados (máximo 160 caracteres)"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                              {(editForm.description || '').length}/160 caracteres
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bio">Biografía completa *</Label>
                            <Textarea
                              id="bio"
                              value={editForm.bio || ''}
                              onChange={(e) => updateEditForm('bio', e.target.value)}
                              placeholder="Biografía detallada del DJ"
                              rows={8}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Genres */}
                            <div className="space-y-2">
                              <Label>Géneros musicales *</Label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {(editForm.genres || []).map((genre, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {genre}
                                    <X
                                      className="h-3 w-3 cursor-pointer"
                                      onClick={() => removeArrayItem('genres', index)}
                                    />
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Agregar género"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addArrayItem('genres', (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const input = document.querySelector('input[placeholder="Agregar género"]') as HTMLInputElement;
                                    if (input?.value) {
                                      addArrayItem('genres', input.value);
                                      input.value = '';
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Job Titles */}
                            <div className="space-y-2">
                              <Label>Ocupaciones / Roles</Label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {(editForm.jobTitle || []).map((title, index) => (
                                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {title}
                                    <X
                                      className="h-3 w-3 cursor-pointer"
                                      onClick={() => {
                                        const newTitles = [...(editForm.jobTitle || [])];
                                        newTitles.splice(index, 1);
                                        updateEditForm('jobTitle', newTitles);
                                      }}
                                    />
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Agregar ocupación (ej: Productor)"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (e.target as HTMLInputElement).value;
                                      if (val.trim()) {
                                        updateEditForm('jobTitle', [...(editForm.jobTitle || []), val.trim()]);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const input = document.querySelector('input[placeholder="Agregar ocupación (ej: Productor)"]') as HTMLInputElement;
                                    if (input?.value) {
                                      updateEditForm('jobTitle', [...(editForm.jobTitle || []), input.value.trim()]);
                                      input.value = '';
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="performerType">Tipo de Artista</Label>
                            <Select
                              value={editForm.performerType || 'DJ'}
                              onValueChange={(value) => updateEditForm('performerType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DJ">DJ</SelectItem>
                                <SelectItem value="Group">Grupo / Dúo</SelectItem>
                                <SelectItem value="Person">Solista / Live Act</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TabsContent>

                        <TabsContent value="media" className="mt-0 space-y-6">
                          {/* Image */}
                          <div className="space-y-2">
                            <Label htmlFor="imageUrl">Foto de Perfil (Cuadrada 1:1) *</Label>
                            <div className="flex gap-4 items-start">
                              <div className="flex-1 space-y-2">
                                <FileUpload
                                  folder="djs/images"
                                  currentUrl={editForm.imageUrl}
                                  onUploadComplete={(url) => updateEditForm('imageUrl', url)}
                                  onClear={() => updateEditForm('imageUrl', '')}
                                />
                                {imageAspectRatioWarning && (
                                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                    {imageAspectRatioWarning}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cover Image */}
                          <div className="space-y-2">
                            <Label htmlFor="coverImage">Foto de Portada (Horizontal 16:9) *</Label>
                            <div className="flex gap-4 items-start">
                              <div className="flex-1 space-y-2">
                                <FileUpload
                                  folder="djs/covers"
                                  currentUrl={editForm.coverImage}
                                  onUploadComplete={(url) => updateEditForm('coverImage', url)}
                                  onClear={() => updateEditForm('coverImage', '')}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Se recomienda una imagen de alta resolución (min 1920x1080) para el encabezado del perfil.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Gallery Images */}
                          <div className="space-y-2">
                            <Label>Galería de Fotos</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {(editForm.galleryImages || []).map((img, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                  <img 
                                    src={img} 
                                    alt={`Gallery ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removeArrayItem('galleryImages', index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4">
                              <Label className="text-sm text-muted-foreground mb-2 block">Agregar nueva imagen a la galería</Label>
                              <FileUpload
                                folder="djs/gallery"
                                onUploadComplete={(url) => addArrayItem('galleryImages', url)}
                                className="max-w-md"
                              />
                            </div>
                          </div>

                          {/* Social Links */}
                          <div className="space-y-4 pt-4 border-t border-border">
                            <Label className="text-base">Redes Sociales y Plataformas</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="instagram" className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</Label>
                                <Input
                                  id="instagram"
                                  value={editForm.socialLinks?.instagram || ''}
                                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                                  placeholder="https://instagram.com/username"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="facebook" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Facebook</Label>
                                <Input
                                  id="facebook"
                                  value={editForm.socialLinks?.facebook || ''}
                                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                                  placeholder="https://facebook.com/username"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="twitter" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Twitter/X</Label>
                                <Input
                                  id="twitter"
                                  value={editForm.socialLinks?.twitter || ''}
                                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                                  placeholder="https://twitter.com/username"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="youtube" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> YouTube</Label>
                                <Input
                                  id="youtube"
                                  value={editForm.socialLinks?.youtube || ''}
                                  onChange={(e) => updateSocialLink('youtube', e.target.value)}
                                  placeholder="https://youtube.com/channel/..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="spotify" className="flex items-center gap-2"><Music className="w-4 h-4" /> Spotify</Label>
                                <Input
                                  id="spotify"
                                  value={editForm.socialLinks?.spotify || ''}
                                  onChange={(e) => updateSocialLink('spotify', e.target.value)}
                                  placeholder="https://open.spotify.com/artist/..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tiktok" className="flex items-center gap-2"><Share2 className="w-4 h-4" /> TikTok</Label>
                                <Input
                                  id="tiktok"
                                  value={editForm.socialLinks?.tiktok || ''}
                                  onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                                  placeholder="https://tiktok.com/@username"
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="website" className="flex items-center gap-2"><Globe className="w-4 h-4" /> Sitio web oficial</Label>
                                <Input
                                  id="website"
                                  value={editForm.socialLinks?.website || ''}
                                  onChange={(e) => updateSocialLink('website', e.target.value)}
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Famous Tracks */}
                          <div className="space-y-2">
                            <Label>Tracks más famosos</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(editForm.famousTracks || []).map((track, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  {track}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => removeArrayItem('famousTracks', index)}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Agregar track famoso (ej: Animals - 2013)"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    addArrayItem('famousTracks', (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder="Agregar track famoso (ej: Animals - 2013)"]') as HTMLInputElement;
                                  if (input?.value) {
                                    addArrayItem('famousTracks', input.value);
                                    input.value = '';
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Famous Albums */}
                          <div className="space-y-2">
                            <Label>Álbumes destacados</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(editForm.famousAlbums || []).map((album, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                  {album}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => removeArrayItem('famousAlbums', index)}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Agregar álbum famoso"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    addArrayItem('famousAlbums', (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder="Agregar álbum famoso"]') as HTMLInputElement;
                                  if (input?.value) {
                                    addArrayItem('famousAlbums', input.value);
                                    input.value = '';
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="seo" className="mt-0 space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="seoTitle">Título SEO (Meta Title)</Label>
                                <Input
                                  id="seoTitle"
                                  value={editForm.seoTitle || editForm.name || ''}
                                  onChange={(e) => updateEditForm('seoTitle', e.target.value)}
                                  placeholder="Ej: Martin Garrix - DJ Profile, Songs & Tour Dates | RaveHub"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Recomendado: 50-60 caracteres. Si se deja vacío, se generará automáticamente.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="seoDescription">Descripción SEO (Meta Description)</Label>
                                <Textarea
                                  id="seoDescription"
                                  value={editForm.seoDescription || editForm.description || ''}
                                  onChange={(e) => updateEditForm('seoDescription', e.target.value)}
                                  placeholder="Descripción optimizada para motores de búsqueda..."
                                  rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Recomendado: 150-160 caracteres. Aparecerá en los resultados de búsqueda.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label>Palabras Clave (Keywords)</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {(editForm.seoKeywords || editForm.genres || []).map((keyword, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                      {keyword}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => {
                                          const newKeywords = [...(editForm.seoKeywords || editForm.genres || [])];
                                          newKeywords.splice(index, 1);
                                          updateEditForm('seoKeywords', newKeywords);
                                        }}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Agregar palabra clave"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (val.trim()) {
                                          const currentKeywords = editForm.seoKeywords || editForm.genres || [];
                                          updateEditForm('seoKeywords', [...currentKeywords, val.trim()]);
                                          (e.target as HTMLInputElement).value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="Agregar palabra clave"]') as HTMLInputElement;
                                      if (input?.value) {
                                        const currentKeywords = editForm.seoKeywords || editForm.genres || [];
                                        updateEditForm('seoKeywords', [...currentKeywords, input.value.trim()]);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Approval Status moved here as well for visibility */}
                              <div className="pt-4 border-t border-border">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="approved-seo"
                                    checked={editForm.approved || false}
                                    onChange={(e) => updateEditForm('approved', e.target.checked)}
                                    className="rounded w-4 h-4"
                                  />
                                  <Label htmlFor="approved-seo" className="font-medium">Aprobado (visible públicamente)</Label>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 ml-6">
                                  Solo los DJs aprobados serán indexados por Google y aparecerán en el sitemap.
                                </p>
                              </div>
                            </div>

                            {/* Google Preview Section */}
                            <div className="space-y-4">
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Vista Previa en Google
                              </h3>
                              
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-[600px]">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                    <img src="/icons/icon-192x192.png" alt="Logo" className="w-4 h-4 opacity-50" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-[#202124]">RaveHub</span>
                                    <span className="text-xs text-[#5f6368]">https://www.ravehublatam.com › djs › {generateSlug(editForm.name || 'dj-name')}</span>
                                  </div>
                                  <div className="ml-auto">
                                    <div className="text-[#5f6368] cursor-pointer">⋮</div>
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer truncate font-normal leading-snug mb-1">
                                      {editForm.seoTitle || editForm.name || 'Nombre del DJ'} | Ravehub
                                    </h3>
                                    <p className="text-sm text-[#4d5156] leading-relaxed line-clamp-3">
                                      {(() => {
                                        // Replicate generateDJMetadata logic for description
                                        const baseBio = editForm.seoDescription || editForm.description || `Perfil de ${editForm.name || 'DJ'}, DJ de ${editForm.country || 'Latinoamérica'}. Descubre su música, próximos eventos y biografía completa.`;
                                        
                                        // Check for upcoming events in selectedDj
                                        // Prefer eventsSummary which has detailed info including city
                                        const eventsSummary = selectedDj?.eventsSummary || [];
                                        const upcomingEvents = selectedDj?.upcomingEvents || [];
                                        
                                        // Filter for future events
                                        const now = new Date();
                                        const today = now.toISOString().split('T')[0];
                                        
                                        let validEvents: any[] = [];
                                        
                                        if (eventsSummary.length > 0) {
                                          validEvents = eventsSummary.filter(e => !e.isPast && e.startDate >= today && e.city);
                                        } else if (upcomingEvents.length > 0) {
                                          // Fallback to legacy upcomingEvents if they have location data (unlikely in legacy but possible)
                                          validEvents = upcomingEvents.filter(e => e.startDate >= today);
                                        }
                                        
                                        if (validEvents.length > 0) {
                                          // Extract unique cities
                                          const cities = Array.from(new Set(
                                            validEvents
                                              .map(e => e.city || (e.location && e.location.city)) // Handle both structures
                                              .filter((city): city is string => Boolean(city))
                                          ));
                                          
                                          if (cities.length > 0) {
                                            const listFormatter = new (Intl as any).ListFormat('es', { style: 'long', type: 'conjunction' });
                                            const cityList = listFormatter.format(cities);
                                            
                                            // Get year from nearest event
                                            // Sort by date just in case
                                            validEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                                            const year = new Date(validEvents[0].startDate).getFullYear();
                                            
                                            const prefix = `📅 Próximos eventos: ${editForm.name || 'DJ'} en ${cityList}. Tickets y fechas confirmadas para el tour ${year}. `;
                                            
                                            const maxTotalLength = 155;
                                            const availableSpace = maxTotalLength - prefix.length;
                                            
                                            if (availableSpace > 10) {
                                              let truncatedBio = baseBio.replace(/\s+/g, ' ').trim();
                                              if (truncatedBio.length > availableSpace) {
                                                truncatedBio = truncatedBio.substring(0, availableSpace - 3).trim() + '...';
                                              }
                                              return `${prefix}${truncatedBio}`;
                                            }
                                            return prefix;
                                          }
                                        }
                                        
                                        // Fallback if no events or no cities found
                                        let description = baseBio.replace(/\s+/g, ' ').trim();
                                        if (description.length > 155) {
                                          description = description.substring(0, 152).trim() + '...';
                                        }
                                        return description;
                                      })()}
                                    </p>
                                  </div>
                                  {editForm.imageUrl && (
                                    <div className="hidden sm:block flex-shrink-0">
                                      <div className="w-[104px] h-[104px] rounded-lg overflow-hidden border border-gray-200">
                                        <img 
                                          src={editForm.imageUrl} 
                                          alt={editForm.name || 'DJ'} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-muted/30 p-4 rounded-lg border border-border mt-6">
                                <h4 className="text-sm font-medium mb-2">Consejos de Optimización SEO</h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                                  <li>El título debe ser conciso. Se agregará automáticamente "| Ravehub" al final.</li>
                                  <li>Incluye palabras clave como "DJ", "Productor", "Eventos" y el país.</li>
                                  <li>La descripción debe ser atractiva para aumentar el CTR (clics).</li>
                                  <li>Usa una imagen de perfil cuadrada de alta calidad (se muestra a la derecha en resultados móviles).</li>
                                  <li>Si el DJ tiene eventos próximos, la descripción se actualizará automáticamente para incluirlos.</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-6">
            {/* Bulk Upload Content */}
            <Card>
              <CardContent className="space-y-6 p-8">
                {/* Template Download */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Plantilla de DJ
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Descarga la plantilla JSON para asegurar que tus datos tengan el formato correcto.
                      </p>
                    </div>
                    <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50" disabled={isDownloading}>
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {downloadStatus || 'Generando...'}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Descargar Plantilla
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${isDragOver ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        Arrastra y suelta tu archivo JSON aquí
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        O selecciona un archivo de tu computadora. Asegúrate de usar el formato de la plantilla.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUpload(file);
                          // Reset input value to allow selecting the same file again
                          e.target.value = '';
                        }}
                      />
                      <Button variant="default" className="pointer-events-none">
                        <FileText className="h-4 w-4 mr-2" />
                        Seleccionar Archivo JSON
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-sm font-medium">Procesando archivo...</span>
                        <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                      </div>
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
                            className={`p-4 border-b border-border last:border-b-0 ${result.success ? 'bg-green-50 dark:bg-green-950/20' :
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
