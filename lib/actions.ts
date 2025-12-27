/**
 * Server Actions with revalidation for critical updates
 */

'use server';

import { blogCollection, eventsCollection, productsCollection, blogCommentsCollection, ticketTransactionsCollection, paymentInstallmentsCollection, usersCollection } from '@/lib/firebase/collections';
import { createNotification, InstallmentNotifications } from '@/lib/utils/notifications';
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
  paidInstallmentsIndices?: number[]; // -1 for reservation, 0+ for installments
  installmentProofs?: Record<number, string>; // { -1: "url1", 0: "url2", ... }
}): Promise<{ success: boolean; error?: string; ticketId?: string }> {
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
      ticketDeliveryStatus: data.paymentStatus === 'approved' ? 'available' : 'pending',
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
          const reservationProof = data.installmentProofs?.[-1] || null;
          batchPromises.push(
            paymentInstallmentsCollection.create({
              transactionId: ticketId,
              installmentNumber: 0, // 0 for Reservation
              amount: data.reservationAmount,
              currency: 'PEN',
              dueDate: new Date().toISOString(), // Due immediately
              status: isReservationPaid ? 'paid' : 'pending',
              adminApproved: isReservationPaid ? true : false,
              ...(isReservationPaid && { paidAt: new Date().toISOString() }),
              ...(reservationProof && { proofUrl: reservationProof })
            })
          );
        }

        // 2. Create Future Installments
        const futureInstallments = plan.installments.map((inst, index) => {
          // Check if this installment was marked as paid
          // Note: index matches the order in plan.installments array (0, 1, 2...)
          const isPaid = data.paidInstallmentsIndices?.includes(index);
          const proof = data.installmentProofs?.[index] || null;

          return paymentInstallmentsCollection.create({
            transactionId: ticketId,
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            currency: 'PEN',
            dueDate: inst.dueDate.toISOString(),
            status: isPaid ? 'paid' : 'pending',
            adminApproved: isPaid ? true : false,
            ...(isPaid && { paidAt: new Date().toISOString() }),
            ...(proof && { proofUrl: proof })
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

/**
 * Get all installments for a ticket transaction
 */
export async function getTicketInstallments(transactionId: string): Promise<{
  success: boolean;
  installments?: any[];
  error?: string;
}> {
  'use server';

  try {
    const installments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: transactionId }
    ]);

    // Sort by installmentNumber
    const sorted = installments.sort((a, b) => a.installmentNumber - b.installmentNumber);

    return { success: true, installments: sorted };
  } catch (error: any) {
    console.error('Error fetching installments:', error);
    return { success: false, error: error.message || 'Error al cargar las cuotas' };
  }
}

// --- Installment Proofs Management ---

export async function getPendingInstallments() {
  'use server';
  try {
    // Fetch installments that are explicitly 'pending-approval' or have a userUploadedProofUrl but are not paid
    // Ideally, we search by 'status' if we used a dedicated status. 
    // Since 'pending-approval' might be a visual state, we check logic:
    // status !== 'paid' && userUploadedProofUrl exists && !adminApproved

    // Firestore composite index might be needed for complex queries.
    // Simpler: Fetch all 'pending' status installments where userUploadedProofUrl != null? 
    // Firestore doesn't support '!='. 
    // Let's query installments with status 'pending' and client-side filter (or fetch all and filter).
    // Better: If we rely on the `status` field being updated to something distinct, it is easier.
    // But currently `status` might still be `pending` for unpaid ones and `paid` for paid ones.
    // The `InstallmentCard` determines 'pending-approval' by `installment.userUploadedProofUrl && !installment.adminApproved`.

    const installments = await paymentInstallmentsCollection.query([
      { field: 'adminApproved', operator: '==', value: false }
    ]);

    // Filter for those that HAVE a proof uploaded
    const pendingReview = installments.filter((i: any) => i.userUploadedProofUrl);

    // Initial simple enrich (fetching user and event data might be heavy if many, 
    // but useful for admin UI).
    const enriched = await Promise.all(pendingReview.map(async (inst: any) => {
      const ticket = await ticketTransactionsCollection.get(inst.transactionId);
      let user = null;
      let event = null;
      if (ticket) {
        user = await usersCollection.get(ticket.userId);
        event = await eventsCollection.get(ticket.eventId);
      }
      return {
        ...inst,
        ticket,
        user,
        event
      };
    }));

    return { success: true, installments: enriched };
  } catch (error: any) {
    console.error('Error fetching pending installments:', error);
    return { success: false, error: 'Error al cargar cuotas pendientes' };
  }
}

export async function uploadUserInstallmentProof(
  installmentId: string,
  downloadURL: string
): Promise<{ success: boolean; error?: string }> {
  'use server';

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    await paymentInstallmentsCollection.update(installmentId, {
      userUploadedProofUrl: downloadURL,
      userUploadedAt: new Date().toISOString(),
      // status remains 'pending', but UI shows 'pending-approval'
    });

    // Notify Admin (System)
    // In a real app, you might notify a topic or specific admin IDs.
    // For now, we'll log it or create a general notification if we had an admin user ID context.
    console.log(`[Admin Notification] New proof for installment ${installment.installmentNumber} of ticket ${installment.transactionId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error uploading proof:', error);
    return { success: false, error: error.message || 'Error al subir comprobante' };
  }
}

// Admin Action: Approve Proof
export async function approveInstallmentProof(
  installmentId: string
): Promise<{ success: boolean; error?: string }> {
  'use server';

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // 1. Update the Installment
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'paid',
      adminApproved: true,
      paidAt: new Date().toISOString(),
      // Move user proof to official proof
      proofUrl: installment.userUploadedProofUrl || installment.proofUrl,
      paymentProofUrl: installment.userUploadedProofUrl || installment.proofUrl,
    });

    // Fetch ticket to get userId for notification
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (ticket) {
      await createNotification({
        userId: ticket.userId,
        ...InstallmentNotifications.paymentApproved(ticket.id, installment.installmentNumber)
      });
    }

    // 2. Check if ALL installments for this ticket are now paid
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: installment.transactionId }
    ]);

    // We verify against the just-updated status? 
    // The query might return the old status if not strongly consistent or if we don't manually patch the result.
    // Safe bet: Check if every OTHER installment is paid.

    const areOthersPaid = allInstallments
      .filter(i => i.id !== installmentId)
      .every(i => i.status === 'paid' && i.adminApproved);

    if (areOthersPaid) {
      // All paid! Update Ticket Status
      await ticketTransactionsCollection.update(installment.transactionId, {
        paymentStatus: 'approved',
        ticketDeliveryStatus: 'available', // Ready for download (subject to date check)
        updatedAt: new Date().toISOString()
      });
    }

    // Optional: Notify user (implement later)

    return { success: true };
  } catch (error: any) {
    console.error('Error approving installment:', error);
    return { success: false, error: error.message || 'Error al aprobar la cuota' };
  }
}

// Admin Action: Reject Proof
export async function rejectInstallmentProof(
  installmentId: string,
  reason: string = 'Comprobante inválido'
): Promise<{ success: boolean; error?: string }> {
  'use server';

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    await paymentInstallmentsCollection.update(installmentId, {
      status: 'rejected',
      adminApproved: false,
      userUploadedProofUrl: null, // Clear it so they can re-upload? Or keep it for history?
      // Keeping it null forces them to upload again logic-wise in many cases, or we can add a 'rejectionReason' field.
      // Let's clear the proof URL to reset the state to "pending upload" visually but maybe we should keep a history.
      // Ideally reset to allows re-upload.
    });

    // Fetch ticket to get userId for notification
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (ticket) {
      await createNotification({
        userId: ticket.userId,
        ...InstallmentNotifications.paymentRejected(ticket.id, installment.installmentNumber, reason)
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting installment:', error);
    return { success: false, error: error.message || 'Error al rechazar la cuota' };
  }
}