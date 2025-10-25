/**
 * Server Actions with revalidation for critical updates
 */

'use server';

import { blogCollection, eventsCollection, productsCollection, blogCommentsCollection } from '@/lib/firebase/collections';
import { revalidateBlogPost, revalidateBlogListing, revalidateEvent, revalidateEventsListing, revalidateProduct, revalidateShopListing, revalidateCommentApproval, revalidateProductStock, revalidateEventCapacity } from '@/lib/revalidate';
import { BlogPost, Event, Product, BlogComment } from '@/lib/types';

/**
 * Server action to update blog post status with revalidation
 */
export async function updateBlogPostStatus(postId: string, status: 'draft' | 'published') {
  try {
    await blogCollection.update(postId, {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'published' && { publishDate: new Date().toISOString() })
    });

    // Revalidate the specific post and listing
    await revalidateBlogPost(postId);
    await revalidateBlogListing();

    return { success: true };
  } catch (error) {
    console.error('Error updating blog post status:', error);
    return { success: false, error: 'Failed to update blog post status' };
  }
}

/**
 * Server action to update event status with revalidation
 */
export async function updateEventStatus(eventId: string, status: 'draft' | 'published') {
  try {
    await eventsCollection.update(eventId, {
      eventStatus: status,
      updatedAt: new Date().toISOString(),
      ...(status === 'published' && { publishDate: new Date().toISOString() })
    });

    // Revalidate the specific event and listing
    await revalidateEvent(eventId);
    await revalidateEventsListing();

    return { success: true };
  } catch (error) {
    console.error('Error updating event status:', error);
    return { success: false, error: 'Failed to update event status' };
  }
}

/**
 * Server action to update product status with revalidation
 */
export async function updateProductStatus(productId: string, isActive: boolean) {
  try {
    await productsCollection.update(productId, {
      isActive,
      updatedAt: new Date().toISOString()
    });

    // Get product slug for revalidation
    const product = await productsCollection.get(productId);
    if (product?.slug) {
      await revalidateProduct(product.slug);
      await revalidateShopListing();
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating product status:', error);
    return { success: false, error: 'Failed to update product status' };
  }
}

/**
 * Server action to update product stock/price with revalidation
 */
export async function updateProductStock(productId: string, stock: number, price?: number) {
  try {
    const updateData: any = {
      stock,
      updatedAt: new Date().toISOString()
    };

    if (price !== undefined) {
      updateData.price = price;
    }

    await productsCollection.update(productId, updateData);

    // Get product slug for revalidation
    const product = await productsCollection.get(productId);
    if (product?.slug) {
      await revalidateProductStock(product.slug);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating product stock:', error);
    return { success: false, error: 'Failed to update product stock' };
  }
}

/**
 * Server action to update event capacity with revalidation
 */
export async function updateEventCapacity(eventId: string, capacity: number) {
  try {
    await eventsCollection.update(eventId, {
      capacity,
      updatedAt: new Date().toISOString()
    });

    // Get event slug for revalidation
    const event = await eventsCollection.get(eventId);
    if (event?.slug) {
      await revalidateEventCapacity(event.slug);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating event capacity:', error);
    return { success: false, error: 'Failed to update event capacity' };
  }
}

/**
 * Server action to approve/reject blog comment with revalidation
 */
export async function updateCommentStatus(commentId: string, status: 'approved' | 'rejected' | 'pending') {
  try {
    await blogCommentsCollection.update(commentId, {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'approved' && { approvedAt: new Date().toISOString() })
    });

    // Get comment to find post slug for revalidation
    const comment = await blogCommentsCollection.get(commentId);
    if (comment?.postSlug) {
      await revalidateCommentApproval(comment.postSlug);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating comment status:', error);
    return { success: false, error: 'Failed to update comment status' };
  }
}

/**
 * Server action to create blog post with revalidation
 */
export async function createBlogPost(postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const postId = await blogCollection.create(postData);

    // Revalidate listing page
    await revalidateBlogListing();

    return { success: true, postId };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { success: false, error: 'Failed to create blog post' };
  }
}

/**
 * Server action to create event with revalidation
 */
export async function createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const eventId = await eventsCollection.create(eventData);

    // Revalidate listing page
    await revalidateEventsListing();

    return { success: true, eventId };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

/**
 * Server action to create product with revalidation
 */
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const productId = await productsCollection.create(productData);

    // Revalidate listing page
    await revalidateShopListing();

    return { success: true, productId };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product' };
  }
}