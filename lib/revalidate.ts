/**
 * Utility functions for on-demand revalidation
 */

const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || 'your-secret-token';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Revalidate a specific path
 */
export async function revalidatePath(path: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: REVALIDATE_TOKEN,
        path,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.error || 'Revalidation failed' };
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return { success: false, message: 'Network error during revalidation' };
  }
}

/**
 * Revalidate by tag
 */
export async function revalidateTag(tag: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: REVALIDATE_TOKEN,
        tag,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.error || 'Revalidation failed' };
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return { success: false, message: 'Network error during revalidation' };
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