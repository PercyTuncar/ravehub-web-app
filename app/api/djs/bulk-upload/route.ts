import { NextRequest, NextResponse } from 'next/server';
import { eventDjsCollection } from '@/lib/firebase/collections';
import { EventDj } from '@/lib/types';
import { generateSlug } from '@/lib/utils/slug-generator';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

interface DjUploadData {
  name: string;
  slug?: string;
  description: string;
  bio: string;
  country: string;
  genres: string[];
  jobTitle?: string[];
  performerType?: string;
  birthDate?: string;
  alternateName?: string;
  imageUrl: string;
  instagramHandle?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    tiktok?: string;
    website?: string;
  };
  famousTracks?: string[];
  famousAlbums?: string[];
  approved: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  overwrite?: boolean; // Flag to indicate this should overwrite existing DJ
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface BulkUploadResult {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
  results: Array<{
    success: boolean;
    data?: DjUploadData;
    error?: string;
    validationErrors?: ValidationError[];
    duplicate?: {
      existing: EventDj;
      shouldOverwrite: boolean;
    };
    djId?: string;
  }>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const body = requestData;

    // Determine if it's a single DJ or array of DJs
    const djsToProcess: DjUploadData[] = Array.isArray(body) ? body : [body];

    if (!djsToProcess || djsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron datos de DJs para procesar' },
        { status: 400 }
      );
    }

    // Limit bulk upload to prevent abuse
    if (djsToProcess.length > 100) {
      return NextResponse.json(
        { error: 'Máximo 100 DJs por carga masiva' },
        { status: 400 }
      );
    }

    const results: BulkUploadResult = {
      success: false,
      summary: {
        total: djsToProcess.length,
        successful: 0,
        failed: 0,
        duplicates: 0
      },
      results: [],
      timestamp: new Date().toISOString()
    };

    // Process each DJ
    for (let i = 0; i < djsToProcess.length; i++) {
      const djData = djsToProcess[i];
      const result = await processSingleDj(djData, i);
      results.results.push(result);

      // Update summary
      if (result.success) {
        results.summary.successful++;
      } else {
        results.summary.failed++;
      }

      if (result.duplicate) {
        results.summary.duplicates++;
      }
    }

    results.success = results.summary.failed === 0;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor durante la carga masiva',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

async function processSingleDj(
  data: DjUploadData, 
  index: number
): Promise<BulkUploadResult['results'][0]> {
  try {
    // Validate the DJ data
    const validationErrors = validateDjData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        data,
        validationErrors,
        error: `Errores de validación: ${validationErrors.map(e => e.message).join(', ')}`
      };
    }

    // Extract Instagram handle from URL if provided
    let instagramHandle = data.instagramHandle;
    if (data.socialLinks?.instagram && !instagramHandle) {
      const extractedHandle = extractInstagramHandle(data.socialLinks.instagram);
      instagramHandle = extractedHandle || undefined;
    }

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check for duplicates by name + country
    let duplicate: EventDj | undefined;
    
    try {
      // Use query for better performance instead of getAll()
      const existingDjs = await eventDjsCollection.query([
        { field: 'name', operator: '==', value: data.name },
        { field: 'country', operator: '==', value: data.country }
      ]);
      
      duplicate = existingDjs[0] as EventDj | undefined;
    } catch (queryError) {
      console.warn('❌ Query failed, falling back to getAll():', queryError);
      
      // Fallback to getAll() if query doesn't work (for compatibility)
      const existingDjs = await eventDjsCollection.getAll();
      duplicate = existingDjs.find((dj) =>
        dj.name?.toLowerCase() === data.name.toLowerCase() &&
        dj.country?.toLowerCase() === data.country.toLowerCase()
      ) as EventDj | undefined;
    }

    if (duplicate && !data.overwrite) {
      return {
        success: false,
        data,
        duplicate: {
          existing: duplicate,
          shouldOverwrite: false // Default to not overwriting, UI will handle this
        },
        error: `DJ duplicado detectado: "${data.name}" de ${duplicate.country}. Ya existe en la base de datos con slug "${duplicate.slug}".`,
        validationErrors: [{
          field: 'duplicate',
          message: `DJ "${data.name}" de ${data.country} ya existe. ¿Desea sobrescribirlo?`,
          value: { existingDj: duplicate }
        }]
      };
    }

    // Handle overwrite if explicitly requested
    if (duplicate && data.overwrite) {
      console.log(`🔄 Overwriting existing DJ: ${duplicate.name} (${duplicate.id})`);
      
      try {
        // Generate slug if not provided
        const slug = data.slug || generateSlug(data.name);
        
        // Update the existing DJ
        await eventDjsCollection.update(duplicate.id, {
          name: data.name,
          slug,
          description: data.description,
          bio: data.bio,
          country: data.country,
          genres: data.genres,
          jobTitle: data.jobTitle || ['DJ', 'Music Producer'],
          performerType: data.performerType || 'DJ',
          birthDate: data.birthDate,
          alternateName: data.alternateName,
          imageUrl: data.imageUrl,
          instagramHandle: data.instagramHandle,
          socialLinks: data.socialLinks || {},
          famousTracks: data.famousTracks || [],
          famousAlbums: data.famousAlbums || [],
          approved: data.approved,
          updatedAt: new Date(),
        });

        // Generate JSON-LD schema for the updated DJ
        try {
          const updatedDjData = { ...data, id: duplicate.id, slug };
          const schema = SchemaGenerator.generate({
            type: 'dj',
            data: updatedDjData
          });

          // Update DJ with SEO data and schema
          await eventDjsCollection.update(duplicate.id, {
            jsonLdSchema: schema,
            seoTitle: data.seoTitle || `${data.name} - DJ Profile | Ravehub`,
            seoDescription: data.seoDescription || `${data.name} is a professional DJ specializing in ${data.genres.join(', ')}.`,
            seoKeywords: data.seoKeywords || data.genres,
          });

          console.log(`✅ Generated and saved JSON-LD Schema for overwritten DJ: ${data.name}`);
        } catch (schemaError) {
          console.error(`❌ Error generating DJ schema for overwritten DJ ${data.name}:`, schemaError);
          // Don't fail the entire operation if schema generation fails
        }

        return {
          success: true,
          data,
          djId: duplicate.id,
          error: undefined
        };
      } catch (updateError) {
        console.error(`❌ Error updating DJ during overwrite:`, updateError);
        return {
          success: false,
          data,
          error: `Error sobrescribiendo DJ: ${updateError instanceof Error ? updateError.message : 'Error desconocido'}`,
          validationErrors: [{
            field: 'overwrite',
            message: 'Error durante la operación de sobrescritura',
            value: updateError
          }]
        };
      }
    }

    // Prepare DJ data for insertion
    const djData: Omit<EventDj, 'id'> = {
      slug,
      name: data.name,
      alternateName: data.alternateName,
      description: data.description,
      bio: data.bio,
      performerType: data.performerType || 'DJ',
      birthDate: data.birthDate,
      country: data.country,
      genres: data.genres,
      jobTitle: data.jobTitle || ['DJ', 'Music Producer'],
      famousTracks: data.famousTracks || [],
      famousAlbums: data.famousAlbums || [],
      imageUrl: data.imageUrl,
      instagramHandle,
      socialLinks: data.socialLinks || {},
      approved: data.approved,
      createdAt: new Date(),
      createdBy: 'admin-bulk-upload',
      updatedAt: new Date(),
    };

    // Insert DJ into database
    const djId = await eventDjsCollection.create(djData);

    // Generate JSON-LD schema for the DJ
    try {
      const schema = SchemaGenerator.generate({
        type: 'dj',
        data: { ...djData, id: djId }
      });

      // Update DJ with SEO data and schema
      await eventDjsCollection.update(djId, {
        jsonLdSchema: schema,
        seoTitle: data.seoTitle || `${data.name} - DJ Profile | Ravehub`,
        seoDescription: data.seoDescription || `${data.name} is a professional DJ specializing in ${data.genres.join(', ')}.`,
        seoKeywords: data.seoKeywords || data.genres,
      });

      console.log(`✅ Generated and saved JSON-LD Schema for DJ: ${data.name}`);
    } catch (schemaError) {
      console.error(`❌ Error generating DJ schema for ${data.name}:`, schemaError);
      // Don't fail the entire operation if schema generation fails
    }

    return {
      success: true,
      data,
      djId,
      error: undefined
    };

  } catch (error) {
    console.error(`Error processing DJ at index ${index}:`, error);
    return {
      success: false,
      data,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el DJ'
    };
  }
}

function validateDjData(data: DjUploadData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'El nombre es obligatorio y debe tener al menos 2 caracteres',
      value: data.name
    });
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push({
      field: 'description',
      message: 'La descripción es obligatoria y debe tener al menos 10 caracteres',
      value: data.description
    });
  }

  if (!data.bio || data.bio.trim().length < 20) {
    errors.push({
      field: 'bio',
      message: 'La biografía es obligatoria y debe tener al menos 20 caracteres',
      value: data.bio
    });
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.push({
      field: 'country',
      message: 'El país es obligatorio',
      value: data.country
    });
  }

  if (!data.imageUrl || !isValidUrl(data.imageUrl)) {
    errors.push({
      field: 'imageUrl',
      message: 'La URL de imagen es obligatoria y debe ser válida',
      value: data.imageUrl
    });
  }

  // Genre validation
  if (!data.genres || !Array.isArray(data.genres) || data.genres.length === 0) {
    errors.push({
      field: 'genres',
      message: 'Debe proporcionar al menos un género musical',
      value: data.genres
    });
  } else {
    data.genres.forEach((genre, index) => {
      if (!genre || typeof genre !== 'string' || genre.trim().length === 0) {
        errors.push({
          field: `genres[${index}]`,
          message: `El género en posición ${index} no puede estar vacío`,
          value: genre
        });
      }
    });
  }

  // Approved field validation
  if (typeof data.approved !== 'boolean') {
    errors.push({
      field: 'approved',
      message: 'El campo approved debe ser un boolean (true o false)',
      value: data.approved
    });
  }

  // Optional field validations
  if (data.birthDate && !isValidDate(data.birthDate)) {
    errors.push({
      field: 'birthDate',
      message: 'La fecha de nacimiento debe estar en formato YYYY-MM-DD',
      value: data.birthDate
    });
  }

  if (data.socialLinks?.instagram && !isValidUrl(data.socialLinks.instagram)) {
    errors.push({
      field: 'socialLinks.instagram',
      message: 'La URL de Instagram no es válida',
      value: data.socialLinks.instagram
    });
  }

  // Social media URL validations
  const socialFields = ['facebook', 'twitter', 'youtube', 'spotify', 'tiktok', 'website'] as const;
  socialFields.forEach(field => {
    const url = data.socialLinks?.[field];
    if (url && !isValidUrl(url)) {
      errors.push({
        field: `socialLinks.${field}`,
        message: `La URL de ${field} no es válida`,
        value: url
      });
    }
  });

  return errors;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function extractInstagramHandle(url: string): string | null {
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
}