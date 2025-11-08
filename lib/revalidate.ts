/**
 * Utility functions for on-demand revalidation
 */

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || 'your-secret-token';

/**
 * Get the base URL for API calls
 * Works in both client and server environments
 */
function getBaseUrl(): string {
  // In client environment, use window.location.origin if available
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  }
  
  // In server environment, use environment variable or default
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

/**
 * Revalidate a specific path
 * This function is non-blocking and will never throw errors
 */
export async function revalidatePath(path: string): Promise<{ success: boolean; message: string }> {
  // Silently fail if path is invalid
  if (!path || typeof path !== 'string') {
    return { success: false, message: 'Invalid path' };
  }

  try {
    const baseUrl = getBaseUrl();
    
    // Validate URL before attempting fetch
    if (!baseUrl || baseUrl === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Revalidation skipped: Invalid base URL');
      }
      return { success: false, message: 'Invalid base URL' };
    }

    const url = `${baseUrl}/api/revalidate`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: REVALIDATE_TOKEN,
          path,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (process.env.NODE_ENV === 'development') {
          console.warn('Revalidation API error:', response.status, errorText);
        }
        return { success: false, message: `Revalidation failed: ${response.status}` };
      }

      const data = await response.json().catch(() => ({ message: 'Revalidated' }));

      return { success: true, message: data.message || 'Path revalidated successfully' };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle abort (timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Revalidation timeout for path:', path);
        }
        return { success: false, message: 'Revalidation timeout' };
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    // Silently fail - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Revalidation error (non-blocking):', error);
    }
    
    // Return failure but don't throw - this is intentional
    return { success: false, message: 'Revalidation failed silently' };
  }
}

/**
 * Revalidate by tag
 * This function is non-blocking and will never throw errors
 */
export async function revalidateTag(tag: string): Promise<{ success: boolean; message: string }> {
  // Silently fail if tag is invalid
  if (!tag || typeof tag !== 'string') {
    return { success: false, message: 'Invalid tag' };
  }

  try {
    const baseUrl = getBaseUrl();
    
    // Validate URL before attempting fetch
    if (!baseUrl || baseUrl === 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Revalidation skipped: Invalid base URL');
      }
      return { success: false, message: 'Invalid base URL' };
    }

    const url = `${baseUrl}/api/revalidate`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: REVALIDATE_TOKEN,
          tag,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (process.env.NODE_ENV === 'development') {
          console.warn('Revalidation API error:', response.status, errorText);
        }
        return { success: false, message: `Revalidation failed: ${response.status}` };
      }

      const data = await response.json().catch(() => ({ message: 'Revalidated' }));

      return { success: true, message: data.message || 'Tag revalidated successfully' };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle abort (timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Revalidation timeout for tag:', tag);
        }
        return { success: false, message: 'Revalidation timeout' };
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    // Silently fail - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Revalidation error (non-blocking):', error);
    }
    
    // Return failure but don't throw - this is intentional
    return { success: false, message: 'Revalidation failed silently' };
  }
}

/**
 * Revalidate blog post pages
 */
export async function revalidateBlogPost(slug: string): Promise<{ success: boolean; message: string }> {
  return revalidatePath(`/blog/${slug}`);
}

/**
 * Revalidate event pages
 */
export async function revalidateEvent(slug: string): Promise<{ success: boolean; message: string }> {
  return revalidatePath(`/eventos/${slug}`);
}

/**
 * Revalidate product pages
 */
export async function revalidateProduct(slug: string): Promise<{ success: boolean; message: string }> {
  return revalidatePath(`/tienda/${slug}`);
}

/**
 * Revalidate blog listing page
 */
export async function revalidateBlogListing(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/blog');
}

/**
 * Revalidate events listing page
 */
export async function revalidateEventsListing(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/eventos');
}

/**
 * Revalidate shop listing page
 */
export async function revalidateShopListing(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/tienda');
}

/**
 * Revalidate DJs listing page
 */
export async function revalidateDJsListing(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/djs');
}

/**
 * Revalidate home page
 */
export async function revalidateHomePage(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/');
}

/**
 * Revalidate comment approval - revalidate the specific blog post
 */
export async function revalidateCommentApproval(postSlug: string): Promise<{ success: boolean; message: string }> {
  return revalidateBlogPost(postSlug);
}

/**
 * Revalidate product stock/price changes
 */
export async function revalidateProductStock(productSlug: string): Promise<{ success: boolean; message: string }> {
  // Revalidate both product page and shop listing
  const productResult = await revalidateProduct(productSlug);
  const listingResult = await revalidateShopListing();

  if (productResult.success && listingResult.success) {
    return { success: true, message: 'Product and shop listing revalidated' };
  } else {
    return { success: false, message: 'Failed to revalidate product or shop listing' };
  }
}

/**
 * Revalidate event capacity changes
 */
export async function revalidateEventCapacity(eventSlug: string): Promise<{ success: boolean; message: string }> {
  // Revalidate both event page and events listing
  const eventResult = await revalidateEvent(eventSlug);
  const listingResult = await revalidateEventsListing();

  if (eventResult.success && listingResult.success) {
    return { success: true, message: 'Event and events listing revalidated' };
  } else {
    return { success: false, message: 'Failed to revalidate event or events listing' };
  }
}

/**
 * Revalidate sitemap.xml
 * This should be called whenever content is created, updated, or deleted
 */
export async function revalidateSitemap(): Promise<{ success: boolean; message: string }> {
  return revalidatePath('/sitemap.xml');
}