/**
 * Utility function to generate DJ metadata consistently
 * This function replicates the exact logic from generateMetadata in the DJ page
 * to ensure previews match exactly what will be shown in Google and social media
 */
import { getReadableFirebaseUrl } from '@/lib/utils/url-helpers';

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

  // Description logic based on requirements
  // Case A: Has events -> [DJ Name] en [City List]. Tickets y fechas confirmadas para el tour [Year]. [Bio...]
  // Case B: No events -> [Bio...]

  // Base bio/description
  const baseBio = djData.seoDescription || djData.description || `Perfil de ${djData.name || 'DJ'}, DJ de ${djData.country || 'Latinoamérica'}. Descubre su música, próximos eventos y biografía completa.`;

  let description = baseBio;

  // Filter to ensure events have location data
  const validUpcomingEvents = (upcomingEvents || []).filter((event: EventForMetadata) =>
    event && event.slug && event.name && event.location && event.location.city
  );

  if (validUpcomingEvents.length > 0) {
    // CASO A: El DJ TIENE eventos próximos

    // 1. Extract unique cities
    // We use a Set to remove duplicates, and filter out any empty values
    const cities = Array.from(new Set(
      validUpcomingEvents
        .map(e => e.location?.city)
        .filter((city): city is string => Boolean(city))
    ));

    // 2. Format City List
    // "Lima", "Lima y Bogotá", "Lima, Santiago y Bogotá"
    // Cast to any to avoid TypeScript error if lib is not configured for ES2020+
    const listFormatter = new (Intl as any).ListFormat('es', { style: 'long', type: 'conjunction' });
    const cityList = listFormatter.format(cities);

    // 3. Get Year from nearest event (first one since they are sorted by date)
    // We assume validUpcomingEvents are sorted by date as they come from getDjUpcomingEvents
    const nearestEventDate = new Date(validUpcomingEvents[0].startDate);
    const year = nearestEventDate.getFullYear();

    // 4. Construct Prefix
    const prefix = `${djData.name} en ${cityList}. Tickets y fechas confirmadas para el tour ${year}. `;

    // 5. Truncate Bio to fit remaining space
    // Max total length 155-160 chars
    const maxTotalLength = 155;
    const availableSpace = maxTotalLength - prefix.length;

    if (availableSpace > 10) {
      // If there is space for bio, append it truncated
      let truncatedBio = baseBio;
      // Remove newlines and extra spaces from bio to save space
      truncatedBio = truncatedBio.replace(/\s+/g, ' ').trim();

      if (truncatedBio.length > availableSpace) {
        truncatedBio = truncatedBio.substring(0, availableSpace - 3).trim() + '...';
      }
      description = `${prefix}${truncatedBio}`;
    } else {
      // If prefix alone is too long or takes up all space, just use prefix
      // We might want to truncate prefix if it's extremely long, but usually we prioritize the tour info
      description = prefix.trim();
    }
  } else {
    // CASO B: El DJ NO TIENE eventos próximos (Fallback)
    description = baseBio.replace(/\s+/g, ' ').trim();
    if (description.length > 155) {
      description = description.substring(0, 152).trim() + '...';
    }
  }

  // URL generation - use baseUrl parameter for consistency
  const slug = djData.slug || (djData.name ? djData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'dj');
  const url = `${baseUrl}/djs/${slug}`;

  // Image - use imageUrl or fallback
  const image = getReadableFirebaseUrl(djData.imageUrl) || '/images/default-dj.jpg';

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
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ravehublatam.com';
}
