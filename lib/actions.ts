/**
 * Server Actions with revalidation for critical updates
 */

'use server';

import { blogCollection, eventsCollection, productsCollection, blogCommentsCollection, ticketTransactionsCollection, paymentInstallmentsCollection } from '@/lib/firebase/collections';
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

/**
 * Server action to upload ticket payment proof
 */
export async function uploadTicketProof(ticketId: string, proofUrl: string) {
  try {
    await ticketTransactionsCollection.update(ticketId, {
      paymentProofUrl: proofUrl,
      paymentStatus: 'pending', // Reset to pending for review
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to upload ticket proof' };
  }
}

/**
 * Server action to update ticket payment status (Admin)
 */
export async function updateTicketPaymentStatus(ticketId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) {
  try {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date().toISOString()
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await ticketTransactionsCollection.update(ticketId, updateData);

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update ticket status' };
  }
}

/**
 * Server action to create a manual ticket transaction (Admin)
 */
export async function createManualTicketTransaction(data: {
  userId: string;
  eventId: string;
  phaseId: string;
  phaseName: string;
  zoneId: string;
  zoneName: string;
  quantity: number;
  totalAmount: number;
  unitPrice: number;
  paymentType: 'full' | 'installment';
  paymentMethod: string;
  reservationAmount?: number;
  installmentsCount?: number;
  firstInstallmentDate?: string; // ISO String
  paymentStatus: 'pending' | 'approved';
  paidInstallmentsIndices?: number[]; // indices of installments that are already paid
}) {
  try {
    // 1. Create Ticket Transaction
    const ticketData: any = {
      userId: data.userId,
      eventId: data.eventId,
      ticketItems: [
        {
          zoneId: data.zoneId,
          zoneName: data.zoneName,
          phaseId: data.phaseId,
          phaseName: data.phaseName,
          quantity: data.quantity,
          pricePerTicket: data.unitPrice,
          totalAmount: data.unitPrice * data.quantity
        }
      ],
      totalAmount: data.totalAmount,
      currency: 'PEN', // Todo: Get from Event or dynamic
      paymentMethod: data.paymentMethod,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      ticketDeliveryMode: 'manualUpload', // Default for now
      ticketDeliveryStatus: data.paymentStatus === 'approved' && data.paymentMethod === 'courtesy' ? 'available' : 'pending',
      isCourtesy: data.paymentMethod === 'courtesy',
      createdAt: new Date().toISOString()
    };

    if (data.paymentType === 'installment') {
      ticketData.installments = data.installmentsCount;
      ticketData.reservationAmount = data.reservationAmount;
    }

    const ticketId = await ticketTransactionsCollection.create(ticketData);

    // 2. Create Payment Installments (if applicable)
    if (data.paymentType === 'installment' && data.installmentsCount && data.firstInstallmentDate) {
      const { calculateInstallmentPlan } = await import('@/lib/utils/admin-ticket-calculator');

      const plan = calculateInstallmentPlan(
        data.unitPrice * data.quantity, // Use base amount for calculation, not the (potentially 0) totalAmount
        data.reservationAmount || 0,
        data.installmentsCount,
        new Date(data.firstInstallmentDate)
      );

      if (plan.success && plan.installments) {
        // Create a document for each installment
        const batchPromises: Promise<any>[] = [];

        // 1. Create Reservation Installment (Installment 0)
        // We create this even if amount is 0? Generally reservation > 0 for installments.
        if (data.reservationAmount && data.reservationAmount > 0) {
          const isReservationPaid = data.paidInstallmentsIndices?.includes(-1);
          batchPromises.push(
            paymentInstallmentsCollection.create({
              transactionId: ticketId,
              installmentNumber: 0, // 0 for Reservation
              amount: data.reservationAmount,
              currency: 'PEN',
              dueDate: new Date().toISOString(), // Due immediately
              status: isReservationPaid ? 'paid' : 'pending',
              adminApproved: isReservationPaid ? true : false,
              ...(isReservationPaid && { paidAt: new Date().toISOString() })
            })
          );
        }

        // 2. Create Future Installments
        const futureInstallments = plan.installments.map((inst, index) => {
          // Check if this installment was marked as paid
          // Note: index matches the order in plan.installments array (0, 1, 2...)
          const isPaid = data.paidInstallmentsIndices?.includes(index);

          return paymentInstallmentsCollection.create({
            transactionId: ticketId,
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            currency: 'PEN',
            dueDate: inst.dueDate.toISOString(),
            status: isPaid ? 'paid' : 'pending',
            adminApproved: isPaid ? true : false,
            ...(isPaid && { paidAt: new Date().toISOString() })
          });
        });

        batchPromises.push(...futureInstallments);

        await Promise.all(batchPromises);
      }
    }

    return { success: true, ticketId };
  } catch (error: any) {
    console.error('Error creating manual ticket:', error);
    return { success: false, error: error.message || 'Error al crear el ticket' };
  }
}

/**
 * Delete a ticket transaction and all associated payment installments
 */
export async function deleteTicketTransaction(ticketId: string): Promise<{ success: boolean; error?: string }> {
  'use server';

  try {
    // Delete all payment installments associated with this ticket
    const installments = await paymentInstallmentsCollection.query([
      { field: 'ticketTransactionId', operator: '==', value: ticketId }
    ]);

    // Delete installments in parallel
    await Promise.all(
      installments.map(installment => paymentInstallmentsCollection.delete(installment.id))
    );

    // Delete the ticket transaction itself
    await ticketTransactionsCollection.delete(ticketId);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return { success: false, error: error.message || 'Error al eliminar el ticket' };
  }
}