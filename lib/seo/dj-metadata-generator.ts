/**
 * Utility function to generate DJ metadata consistently
 * This function replicates the exact logic from generateMetadata in the DJ page
 * to ensure previews match exactly what will be shown in Google and social media
 */

export interface DJMetadataResult {
  title: string;
  description: string;
  url: string;
  image: string;
  keywords: string[];
  metaTags: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogUrl: string;
    ogType: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
    twitterCard: string;
    twitterSite: string;
    canonicalUrl: string;
    description: string;
    keywords?: string;
  };
}

export interface DJDataForMetadata {
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  country?: string;
  imageUrl?: string;
  slug: string;
  seoKeywords?: string[];
  genres?: string[];
  instagramHandle?: string;
}

export interface EventForMetadata {
  slug: string;
  name: string;
  location?: {
    city?: string;
    country?: string;
  };
  startDate: string;
}

/**
 * Generate metadata for a DJ
 * This replicates the exact logic from app/(public)/djs/[slug]/page.tsx generateMetadata
 */
export function generateDJMetadata(
  djData: DJDataForMetadata,
  upcomingEvents: EventForMetadata[] = [],
  baseUrl: string = 'https://www.ravehublatam.com'
): DJMetadataResult {
  // Title: Only the DJ name (or seoTitle if provided) - EXACTLY as in generateMetadata
  const title = djData.seoTitle || djData.name || 'DJ sin nombre';
  
  // Description: Base description + upcoming events info if available - EXACTLY as in generateMetadata
  let description = djData.seoDescription || djData.description || `Perfil de ${djData.name || 'DJ'}, DJ de ${djData.country || 'Latinoamérica'}. Descubre su música, próximos eventos y biografía completa.`;
  
  // Add upcoming events information if available - EXACTLY as in generateMetadata
  // Filter to ensure events have location data (same filter as in generateMetadata)
  const validUpcomingEvents = (upcomingEvents || []).filter((event: EventForMetadata) => 
    event && event.slug && event.name && event.location && event.location.city
  );
  
  if (validUpcomingEvents.length > 0) {
    // Extract unique city, country combinations - EXACTLY as in generateMetadata
    const locations = new Set<string>();
    validUpcomingEvents.forEach((event: EventForMetadata) => {
      if (event.location && event.location.city && event.location.country) {
        const locationStr = `${event.location.city}, ${event.location.country}`;
        locations.add(locationStr);
      }
    });
    
    if (locations.size > 0) {
      const locationsArray = Array.from(locations);
      const locationsText = locationsArray.join(', ');
      description = `${description} Próximos eventos en: ${locationsText}.`;
    }
  }
  
  // URL generation - use baseUrl parameter for consistency
  const slug = djData.slug || (djData.name ? djData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'dj');
  const url = `${baseUrl}/djs/${slug}`;
  
  // Image - use imageUrl or fallback
  const image = djData.imageUrl || '/images/default-dj.jpg';
  
  // Keywords - EXACTLY as in generateMetadata
  // Filter out undefined/null values and ensure all are strings
  const keywords = (djData.seoKeywords && djData.seoKeywords.length > 0
    ? djData.seoKeywords
    : ['DJ', 'música electrónica', 'rave', 'eventos', djData.country, djData.name, ...(djData.genres || [])]
  ).filter((keyword): keyword is string => Boolean(keyword) && typeof keyword === 'string');

  // Generate Open Graph and Twitter Card meta tags - EXACTLY as in generateMetadata
  const metaTags = {
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogUrl: url,
    ogType: 'profile',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterCard: 'summary_large_image',
    twitterSite: '@ravehublatam',
    canonicalUrl: url,
    description: description,
    keywords: keywords.join(', '),
  };

  return {
    title,
    description,
    url,
    image,
    keywords,
    metaTags,
  };
}

/**
 * Get base URL based on environment
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If localhost, use localhost URL
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
    
    // Otherwise use production URL
    return 'https://www.ravehublatam.com';
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ravehublatam.com';
}

