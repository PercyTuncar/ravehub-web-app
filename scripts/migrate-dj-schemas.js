/**
 * Script de migración para generar schemas JSON-LD para DJs existentes
 * que no tienen schema generado automáticamente
 * 
 * Ejecutar con: node scripts/migrate-dj-schemas.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, updateDoc, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Importar configuraciones (necesitarás adaptar según tu estructura)
const firebaseConfig = require('../firebase-config.json');

class DjSchemaMigrator {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Genera schema JSON-LD para un DJ
   */
  generateDjSchema(djData) {
    const baseUrl = 'https://www.ravehublatam.com';
    const djUrl = `${baseUrl}/djs/${djData.slug}`;
    const personId = `${djUrl}#person`;
    const websiteId = `${baseUrl}/#website`;
    const organizationId = `${baseUrl}/#organization`;
    const profilePageId = `${djUrl}#webpage`;

    // Helper function to format dates
    const formatDate = (dateValue) => {
      if (!dateValue) return undefined;

      try {
        // Handle Firestore Timestamp objects
        if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
          return new Date(dateValue.seconds * 1000).toISOString();
        }

        // Handle regular date strings or Date objects
        const parsedDate = new Date(dateValue);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
      } catch (error) {
        return undefined;
      }
    };

    // Helper function to process social links
    const getSocialLinks = (socialLinks) => {
      const sameAs = [];
      if (!socialLinks) return sameAs;

      if (socialLinks.instagram) {
        sameAs.push(socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`);
      }
      if (socialLinks.facebook) {
        sameAs.push(socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`);
      }
      if (socialLinks.twitter) {
        sameAs.push(socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://x.com/${socialLinks.twitter.replace('@', '')}`);
      }
      if (socialLinks.youtube) {
        sameAs.push(socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/channel/${socialLinks.youtube}`);
      }
      if (socialLinks.spotify) {
        const spotifyId = socialLinks.spotify.replace('https://open.spotify.com/artist/', '');
        sameAs.push(socialLinks.spotify.startsWith('http') ? socialLinks.spotify : `https://open.spotify.com/artist/${spotifyId}`);
      }
      if (socialLinks.tiktok) {
        sameAs.push(socialLinks.tiktok.startsWith('http') ? socialLinks.tiktok : `https://www.tiktok.com/${socialLinks.tiktok}?lang=es`);
      }
      if (socialLinks.website) {
        sameAs.push(socialLinks.website);
      }

      return sameAs;
    };

    // 1. Person Node (The Artist)
    const personNode = {
      '@type': 'Person',
      '@id': personId,
      name: djData.name,
      alternateName: djData.alternateName || djData.name,
      description: djData.description || djData.bio,
      image: djData.imageUrl ? {
        '@type': 'ImageObject',
        url: djData.imageUrl.replace(/[?&]token=[^&]*/, ''),
        caption: djData.name,
        encodingFormat: 'image/jpeg'
      } : undefined,
      url: djData.socialLinks?.website || djUrl,
      sameAs: getSocialLinks(djData.socialLinks),
      nationality: djData.country ? {
        '@type': 'Country',
        name: djData.country
      } : undefined,
      hasOccupation: [
        { '@type': 'Occupation', name: 'DJ' },
        ...(djData.jobTitle || ['Music Producer']).filter(title => title !== 'DJ').map(title => ({
          '@type': 'Occupation',
          name: title
        }))
      ],
      knowsAbout: djData.genres || [],
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'internalId', value: djData.id },
        { '@type': 'PropertyValue', propertyID: 'slug', value: djData.slug }
      ],
      mainEntityOfPage: { '@id': profilePageId }
    };

    // 2. Event Nodes
    const musicEventNodes = [];
    const eventReferences = [];

    if (djData.upcomingEvents?.length > 0) {
      djData.upcomingEvents.forEach(event => {
        const eventSlug = event.slug || event.eventId;
        const eventUrl = `${baseUrl}/eventos/${eventSlug}`;
        const eventId = `${eventUrl}#event`;

        // Create MusicEvent Node
        musicEventNodes.push({
          '@type': 'MusicEvent',
          '@id': eventId,
          name: event.name,
          description: event.description || `Evento ${event.name}`,
          url: eventUrl,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          startDate: formatDate(event.startDate),
          endDate: event.endDate ? formatDate(event.endDate) : undefined,
          image: event.mainImageUrl ? {
            '@type': 'ImageObject',
            url: event.mainImageUrl.replace(/[?&]token=[^&]*/, ''),
            width: 1200,
            height: 675
          } : undefined,
          location: {
            '@type': 'Place',
            name: event.venue || 'Ubicación por confirmar',
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.city || 'Lima',
              addressCountry: event.country || 'PE'
            }
          },
          organizer: { '@id': organizationId },
          performer: { '@id': personId }
        });

        eventReferences.push({ '@id': eventId });
      });
    }

    if (djData.pastEvents?.length > 0) {
      djData.pastEvents.forEach(event => {
        const eventSlug = event.slug || event.eventId;
        eventReferences.push({
          '@id': `${baseUrl}/eventos/${eventSlug}#event`
        });
      });
    }

    if (eventReferences.length > 0) {
      personNode.performerIn = eventReferences;
    }

    // 3. Album Nodes
    const musicAlbumNodes = [];
    if (djData.famousAlbums?.length > 0) {
      djData.famousAlbums.forEach((album, index) => {
        musicAlbumNodes.push({
          '@type': 'MusicAlbum',
          '@id': `${djUrl}/albums/${index}#album`,
          name: album,
          byArtist: { '@id': personId },
          genre: djData.genres || []
        });
      });
    }

    // 4. Recording Nodes
    const musicRecordingNodes = [];
    if (djData.famousTracks?.length > 0) {
      djData.famousTracks.forEach((track, index) => {
        musicRecordingNodes.push({
          '@type': 'MusicRecording',
          name: track,
          byArtist: { '@id': personId },
          genre: djData.genres?.[0] || 'Electronic'
        });
      });
    }

    // 5. Graph
    const graph = [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: baseUrl,
        name: 'Ravehub',
        alternateName: ['Ravehub'],
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Ravehub',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/#logo`,
          url: `${baseUrl}/icons/logo.png`,
          width: 600,
          height: 60,
        },
        sameAs: [
          'https://www.instagram.com/ravehub.pe',
          'https://www.facebook.com/ravehub'
        ],
      },
      {
        '@type': 'ProfilePage',
        '@id': profilePageId,
        url: djUrl,
        name: `${djData.name} - Perfil del DJ`,
        description: djData.seoDescription || djData.description || djData.bio,
        isPartOf: { '@id': websiteId },
        publisher: { '@id': organizationId },
        dateCreated: formatDate(djData.createdAt),
        dateModified: formatDate(djData.updatedAt),
        mainEntity: { '@id': personId }
      },
      personNode,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: {
              '@type': 'Thing',
              '@id': baseUrl,
              name: 'Inicio'
            }
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'DJs',
            item: {
              '@type': 'Thing',
              '@id': `${baseUrl}/djs`,
              name: 'DJs'
            }
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: djData.name,
            item: {
              '@type': 'Thing',
              '@id': djUrl,
              name: djData.name
            }
          }
        ]
      },
      ...musicEventNodes,
      ...musicAlbumNodes,
      ...musicRecordingNodes
    ];

    // Filter out undefined values recursively
    const removeUndefined = (obj) => {
      if (obj === undefined || obj === null) return undefined;
      if (Array.isArray(obj)) {
        const filtered = obj.map(removeUndefined).filter(item => item !== undefined);
        return filtered.length > 0 ? filtered : undefined;
      }
      if (typeof obj === 'object') {
        const filtered = {};
        Object.keys(obj).forEach(key => {
          const value = removeUndefined(obj[key]);
          if (value !== undefined) {
            filtered[key] = value;
          }
        });
        return Object.keys(filtered).length > 0 ? filtered : undefined;
      }
      return obj;
    };

    return {
      '@context': 'https://schema.org',
      '@graph': graph.map(removeUndefined).filter(node => node !== undefined)
    };
  }

  /**
   * Migra los schemas de todos los DJs en eventDjs
   */
  async migrateEventDjs() {
    console.log('🔄 Iniciando migración de schemas para eventDjs...');

    try {
      const eventDjsRef = collection(this.db, 'eventDjs');
      const q = query(eventDjsRef);
      const querySnapshot = await getDocs(q);

      this.stats.total = querySnapshot.size;
      console.log(`📊 Encontrados ${this.stats.total} DJs en eventDjs`);

      for (const docSnap of querySnapshot.docs) {
        const djData = { id: docSnap.id, ...docSnap.data() };

        try {
          // Skip if already has schema
          if (djData.jsonLdSchema) {
            console.log(`⏭️  Saltando ${djData.name} (ya tiene schema)`);
            this.stats.skipped++;
            continue;
          }

          // Generate schema
          const schema = this.generateDjSchema(djData);

          // Update document with schema and SEO data
          await updateDoc(doc(this.db, 'eventDjs', djData.id), {
            jsonLdSchema: schema,
            seoTitle: djData.seoTitle || `${djData.name} - DJ Profile | Ravehub`,
            seoDescription: djData.seoDescription || `${djData.name} es un DJ especializado en ${djData.genres?.join(', ') || 'música electrónica'}.`,
            seoKeywords: djData.seoKeywords || djData.genres || [],
            updatedAt: new Date()
          });

          this.stats.updated++;
          console.log(`✅ Schema generado para ${djData.name}`);

        } catch (error) {
          this.stats.errors++;
          console.error(`❌ Error con ${djData.name}:`, error.message);
        }
      }

      console.log(`\n🎉 Migración de eventDjs completada:`);
      console.log(`   • Total procesados: ${this.stats.total}`);
      console.log(`   • Actualizados: ${this.stats.updated}`);
      console.log(`   • Saltados: ${this.stats.skipped}`);
      console.log(`   • Errores: ${this.stats.errors}`);

    } catch (error) {
      console.error('❌ Error en migración de eventDjs:', error);
    }
  }

  /**
   * Ejecuta la migración completa
   */
  async run() {
    console.log('🚀 Iniciando proceso de migración de schemas de DJs...\n');

    // Reset stats
    this.stats = { total: 0, updated: 0, skipped: 0, errors: 0 };

    // Migrate eventDjs
    await this.migrateEventDjs();

    console.log('\n✅ Proceso de migración completado');

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      summary: {
        success: this.stats.errors === 0,
        message: this.stats.errors === 0
          ? 'Todos los schemas se generaron correctamente'
          : `Se completaron con ${this.stats.errors} errores`
      }
    };

    const reportPath = path.join(__dirname, 'dj-schema-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${reportPath}`);
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  const migrator = new DjSchemaMigrator();
  migrator.run().catch(console.error);
}

module.exports = DjSchemaMigrator;