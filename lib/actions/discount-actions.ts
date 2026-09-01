'use server';

import { revalidatePath } from 'next/cache';
import { eventsCollection, clearCache } from '@/lib/firebase/collections';

export async function updateEventDiscount(
  eventId: string,
  eventSlug: string,
  discountData: any
) {
  try {
    // Update only the discount field
    await eventsCollection.update(eventId, {
      discount: discountData
    });

    // Clear cache
    clearCache('events:published');

    // Revalidate Next.js pages
    revalidatePath('/eventos');
    revalidatePath('/eventos/[slug]', 'page');
    revalidatePath(`/eventos/${eventSlug}`);
    revalidatePath('/admin/discounts');

    return { success: true };
  } catch (error) {
    console.error('Error updating discount:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
