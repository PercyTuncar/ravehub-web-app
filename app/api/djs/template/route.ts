import { NextRequest, NextResponse } from 'next/server';
import { EventDj } from '@/lib/types';
import { generateSlug } from '@/lib/utils/slug-generator';

export async function GET(request: NextRequest) {
  try {
    // Create a comprehensive template with all possible fields
    const djTemplate: Partial<EventDj> = {
      // Basic Information (Required)
      name: "DJ Ejemplo",
      slug: generateSlug("DJ Ejemplo"),
      description: "Descripción breve del DJ para listados y búsquedas",
      bio: "Biografía detallada del DJ. Incluye su trayectoria musical, influencias, logros destacados, y estilo característico. Esta información aparecerá en el perfil público completo del DJ.",
      
      // Geographic Information (Required)
      country: "Argentina",
      
      // Music Information
      genres: ["Techno", "House", "Electrónica"],
      jobTitle: ["DJ", "Music Producer", "Remixer"],
      performerType: "DJ",
      famousTracks: [
        "Mi Track Famoso 1",
        "Mi Track Famoso 2", 
        "Mi Track Famoso 3"
      ],
      famousAlbums: [
        "Mi Álbum Famoso 1",
        "Mi Álbum Famoso 2"
      ],
      
      // Personal Information
      birthDate: "1990-01-01",
      alternateName: "DJ Alias Alternativo",
      
      // Image and Media
      imageUrl: "https://example.com/dj-image.jpg",
      
      // Social Media Links
      instagramHandle: "djejemplo",
      socialLinks: {
        instagram: "https://instagram.com/djejemplo",
        facebook: "https://facebook.com/djejemplo",
        twitter: "https://twitter.com/djejemplo",
        youtube: "https://youtube.com/channel/djejemplo",
        spotify: "https://open.spotify.com/artist/djejemplo",
        tiktok: "https://tiktok.com/@djejemplo",
        website: "https://djejemplo.com"
      },
      
      // Approval Status
      approved: true,
      
      // System Fields (will be auto-generated)
      createdAt: new Date(),
      createdBy: "admin-bulk-upload",
      updatedAt: new Date(),
    };

    // Create a clean template without system fields for the actual template
    const cleanTemplate = { ...djTemplate };
    delete (cleanTemplate as any).id;
    delete (cleanTemplate as any).createdAt;
    delete (cleanTemplate as any).updatedAt;

    // Create documentation for the template
    const documentation = {
      title: "Plantilla de Carga Masiva de DJs - Ravehub",
      description: "Esta plantilla contiene todos los campos posibles para crear DJs en el sistema Ravehub.",
      fields: {
        // Required Fields
        name: {
          type: "string",
          required: true,
          description: "Nombre artístico del DJ (obligatorio)",
          example: "DJ Ejemplo"
        },
        slug: {
          type: "string", 
          required: true,
          description: "URL amigable del DJ (se genera automáticamente si no se proporciona)",
          example: "dj-ejemplo",
          note: "Solo letras, números y guiones. Se normalizará automáticamente."
        },
        description: {
          type: "string",
          required: true,
          description: "Descripción corta para listados y búsquedas",
          example: "Descripción breve del DJ para listados y búsquedas"
        },
        bio: {
          type: "string",
          required: true,
          description: "Biografía completa del DJ (obligatorio)",
          example: "Biografía detallada del DJ. Incluye su trayectoria musical..."
        },
        country: {
          type: "string",
          required: true,
          description: "País de origen del DJ (obligatorio)",
          example: "Argentina",
          note: "Debe coincidir exactamente con el nombre del país en el sistema"
        },
        genres: {
          type: "array of strings",
          required: true,
          description: "Lista de géneros musicales que interpreta el DJ",
          example: ["Techno", "House", "Electrónica"],
          note: "Mínimo 1 género requerido"
        },
        imageUrl: {
          type: "string",
          required: true,
          description: "URL de la imagen del DJ (obligatorio)",
          example: "https://example.com/dj-image.jpg",
          note: "Debe ser una URL válida y accesible"
        },
        socialLinks: {
          type: "object",
          required: false,
          description: "Enlaces a redes sociales del DJ",
          properties: {
            instagram: { type: "string", description: "URL de Instagram" },
            facebook: { type: "string", description: "URL de Facebook" },
            twitter: { type: "string", description: "URL de Twitter" },
            youtube: { type: "string", description: "URL de YouTube" },
            spotify: { type: "string", description: "URL de Spotify" },
            tiktok: { type: "string", description: "URL de TikTok" },
            website: { type: "string", description: "Sitio web personal" }
          },
          note: "Instagram debe ser una URL válida para extraer el handle automáticamente"
        },
        approved: {
          type: "boolean",
          required: true,
          description: "Estado de aprobación del DJ",
          example: true,
          note: "true = visible públicamente, false = privado"
        },
        
        // Optional Fields
        instagramHandle: {
          type: "string",
          required: false,
          description: "Handle de Instagram (se extrae automáticamente si se proporciona socialLinks.instagram)",
          example: "djejemplo",
          note: "Si no se proporciona, se extrae automáticamente del enlace de Instagram"
        },
        jobTitle: {
          type: "array of strings",
          required: false,
          description: "Títulos laborales del DJ",
          example: ["DJ", "Music Producer", "Remixer"],
          default: ["DJ", "Music Producer"]
        },
        performerType: {
          type: "string",
          required: false,
          description: "Tipo de performer",
          example: "DJ",
          default: "DJ"
        },
        famousTracks: {
          type: "array of strings",
          required: false,
          description: "Lista de tracks famosos del DJ",
          example: ["Mi Track Famoso 1", "Mi Track Famoso 2"],
          note: "Pueden agregarse múltiples tracks"
        },
        famousAlbums: {
          type: "array of strings", 
          required: false,
          description: "Lista de álbumes famosos del DJ",
          example: ["Mi Álbum Famoso 1", "Mi Álbum Famoso 2"],
          note: "Pueden agregarse múltiples álbumes"
        },
        birthDate: {
          type: "string",
          required: false,
          description: "Fecha de nacimiento del DJ (formato ISO)",
          example: "1990-01-01",
          note: "Formato: YYYY-MM-DD"
        },
        alternateName: {
          type: "string",
          required: false,
          description: "Nombre alternativo del DJ",
          example: "DJ Alias Alternativo"
        },
        seoTitle: {
          type: "string",
          required: false,
          description: "Título SEO personalizado",
          note: "Se genera automáticamente si no se proporciona"
        },
        seoDescription: {
          type: "string",
          required: false,
          description: "Descripción SEO personalizada",
          note: "Se genera automáticamente si no se proporciona"
        },
        seoKeywords: {
          type: "array of strings",
          required: false,
          description: "Palabras clave para SEO",
          note: "Se toma de los géneros si no se proporciona"
        }
      },
      validationRules: [
        "El campo 'name' es obligatorio y debe tener al menos 2 caracteres",
        "El campo 'slug' se genera automáticamente si no se proporciona",
        "El campo 'country' debe coincidir exactamente con un país válido",
        "El campo 'genres' debe ser un array con al menos 1 elemento",
        "El campo 'approved' debe ser un boolean (true o false)",
        "Si se proporciona 'socialLinks.instagram', debe ser una URL válida",
        "Los campos 'famousTracks' y 'famousAlbums' deben ser arrays de strings",
        "El campo 'birthDate' debe estar en formato YYYY-MM-DD si se proporciona"
      ],
      tips: [
        "Todos los campos del template son ejemplos, puedes modificarlos o eliminarlos",
        "Solo los campos requeridos (name, description, bio, country, genres, imageUrl, approved) deben estar presentes",
        "Los campos opcionales se pueden omitir completamente",
        "El Instagram handle se extrae automáticamente del enlace si proporcionas socialLinks.instagram",
        "Los DJs duplicados se detectarán por nombre y país, se te dará la opción de sobrescribir"
      ]
    };

    // Create the downloadable template
    const templateContent = {
      template: cleanTemplate,
      documentation: documentation,
      usage: {
        bulkUpload: "Este archivo contiene la estructura para un solo DJ. Para carga masiva, crea un array de múltiples objetos DJ.",
        arrayExample: [
          {
            // Primer DJ
            name: "DJ Uno",
            country: "Argentina",
            description: "Descripción del primer DJ",
            bio: "Biografía del primer DJ",
            genres: ["Techno"],
            imageUrl: "https://example.com/dj1.jpg",
            approved: true
          },
          {
            // Segundo DJ  
            name: "DJ Dos",
            country: "Chile",
            description: "Descripción del segundo DJ",
            bio: "Biografía del segundo DJ", 
            genres: ["House"],
            imageUrl: "https://example.com/dj2.jpg",
            approved: false
          }
        ]
      }
    };

    // Set response headers for file download
    const response = NextResponse.json(templateContent);
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    response.headers.set('Content-Disposition', 'attachment; filename="ravehub-djs-template.json"');
    response.headers.set('Content-Length', Buffer.byteLength(JSON.stringify(templateContent, null, 2)).toString());

    return response;

  } catch (error) {
    console.error('Error generating DJ template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar la plantilla' },
      { status: 500 }
    );
  }
}