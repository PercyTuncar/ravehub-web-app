/**
 * Server Actions with revalidation for critical updates
 */

'use server';

import { blogCollection, eventsCollection, productsCollection, blogCommentsCollection, ticketTransactionsCollection, paymentInstallmentsCollection, usersCollection, ordersCollection } from '@/lib/firebase/admin-collections';
import { createNotification, InstallmentNotifications, OrderNotifications } from '@/lib/utils/notifications';
import { revalidateBlogPost, revalidateBlogListing, revalidateEvent, revalidateEventsListing, revalidateProduct, revalidateShopListing, revalidateCommentApproval, revalidateProductStock, revalidateEventCapacity } from '@/lib/revalidate';
import { BlogPost, Event, Product, BlogComment } from '@/lib/types';
import { requireAdmin, requireAuth } from '@/lib/auth-admin';


/**
 * Server action to update blog post status with revalidation
 */
export async function updateBlogPostStatus(postId: string, status: 'draft' | 'published') {
  try {
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAuth();
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
    await requireAdmin();

    // 1. Get the ticket to check payment type
    const ticket = await ticketTransactionsCollection.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    // 2. Handle Rejection (Global)
    // 2. Handle Rejection
    if (status === 'rejected') {
      if (ticket.paymentType === 'installment') {
        // Reject the SPECIFIC pending installment, not the whole ticket
        // Find the pending installment (pending approval)
        const installments = await paymentInstallmentsCollection.query([
          { field: 'transactionId', operator: '==', value: ticketId }
        ]);

        // Find the one waiting for approval (or the next open one)
        const pendingInst = installments.find(i => !i.adminApproved && i.status !== 'paid' && i.userUploadedProofUrl);

        if (pendingInst) {
          await paymentInstallmentsCollection.update(pendingInst.id, {
            status: 'rejected',
            adminApproved: false,
            // Do NOT clear userUploadedProofUrl so we can see history? Or clear it? 
            // InstallmentCard uses status='rejected' to show "Rechazado" state.
          });

          // Notify user
          await createNotification({
            userId: ticket.userId,
            ...InstallmentNotifications.paymentRejected(ticket.id, pendingInst.installmentNumber, rejectionReason || 'Comprobante rechazado')
          });

          return { success: true, message: 'Cuota rechazada. El usuario deberá subir un nuevo comprobante.' };
        }
      }

      // Default: Reject the entire transaction (e.g. single payment or severe issue)
      await ticketTransactionsCollection.update(ticketId, {
        paymentStatus: 'rejected',
        rejectionReason: rejectionReason || 'Rechazado por administrador',
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    }

    // 3. Handle Approval
    if (status === 'approved') {
      if (ticket.paymentType === 'installment') {
        // Find the first pending installment
        const installments = await paymentInstallmentsCollection.query([
          { field: 'transactionId', operator: '==', value: ticketId }
        ]);

        // Sort by number
        installments.sort((a, b) => a.installmentNumber - b.installmentNumber);

        const firstPending = installments.find(i => i.status !== 'paid');

        if (firstPending) {
          // Approve ONLY this installment
          await paymentInstallmentsCollection.update(firstPending.id, {
            status: 'paid',
            adminApproved: true,
            paidAt: new Date().toISOString(),
            // secure the proof if it was on the ticket (legacy) or just verify it
          });

          // Notify user of installment approval
          await createNotification({
            userId: ticket.userId,
            ...InstallmentNotifications.paymentApproved(ticket.id, firstPending.installmentNumber)
          });

          // Check if ALL are paid now
          const allPaid = installments.every(i => i.id === firstPending.id || i.status === 'paid');

          if (allPaid) {
            await ticketTransactionsCollection.update(ticketId, {
              paymentStatus: 'approved',
              updatedAt: new Date().toISOString()
            });
            // Notify full order completion?
          } else {
            // If partially paid, we ensure the transaction is NOT rejected/expired, stays pending but active
            // We don't change transaction status to approved yet
          }

          return { success: true, message: `Cuota ${firstPending.installmentNumber} aprobada` };
        } else {
          // All already paid
          await ticketTransactionsCollection.update(ticketId, {
            paymentStatus: 'approved',
            updatedAt: new Date().toISOString()
          });
          return { success: true };
        }

      } else {
        // Full Payment: Approve Transaction
        await ticketTransactionsCollection.update(ticketId, {
          paymentStatus: 'approved',
          updatedAt: new Date().toISOString()
        });

        // Notify user
        await createNotification({
          userId: ticket.userId,
          ...OrderNotifications.paymentApproved(ticket.id)
        });

        return { success: true };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating status', error);
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
    await requireAdmin();
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
  await requireAdmin();

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
  await requireAuth();

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
  await requireAdmin();
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
  await requireAuth();

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    await paymentInstallmentsCollection.update(installmentId, {
      userUploadedProofUrl: downloadURL,
      userUploadedAt: new Date().toISOString(),
      status: 'pending', // Reset status to pending so it goes back to review
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
  await requireAdmin();

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
  await requireAdmin();

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
    return { success: false, error: error.message || 'Error al rechazar la cuota' };
  }
}

// Admin Action: Revert/Annull Payment (Mistake Correction)
export async function revertInstallmentPayment(
  installmentId: string
): Promise<{ success: boolean; error?: string }> {
  'use server';
  await requireAdmin();

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // Reset to rejected so user has to upload again
    // We clear paidAt and adminApproved.
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'rejected',
      adminApproved: false,
      paidAt: null,
      // We keep the old proof url (userUploadedProofUrl) or clearing it?
      // If we want them to upload NEW one, keeping it might be confusing if they just re-submit same one.
      // But keeping it allows admin to see "previous" attempt if we had history. 
      // Current logic: status 'rejected' allows upload.
      // Important: We should probably NOT clear the proofUrl field instantly if we want to show "Old proof" but
      // the InstallmentCard logic for 'rejected' shows "Subir Nuevo".
    });

    // Also update parent ticket if it was fully approved, now it's not.
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (ticket && ticket.paymentStatus === 'approved') {
      await ticketTransactionsCollection.update(installment.transactionId, {
        paymentStatus: 'pending', // Revert to pending
        ticketDeliveryStatus: 'pending' // Revoke delivery
      });
    }

    // Notification?
    if (ticket) {
      await createNotification({
        userId: ticket.userId,
        // Using generic message for now or create a new notification type "payment_reverted"
        title: '⚠️ Pago Anulado',
        body: `El pago de la cuota #${installment.installmentNumber} ha sido anulado por un administrador. Por favor revisa y sube el comprobante nuevamente.`,
        type: 'payment',
        orderId: ticket.id
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error reverting installment:', error);
    return { success: false, error: error.message || 'Error al anular el pago' };
  }
}

// --- User Profile Data ---

export async function getUserProfileData(userId: string) {
  'use server';

  // Verify auth
  const currentUser = await requireAuth();
  // Ensure user is requesting their own data or is admin
  if (currentUser.id !== userId && currentUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  try {
    const [tickets, orders] = await Promise.all([
      ticketTransactionsCollection.query([
        { field: 'userId', operator: '==', value: userId }
      ], 'createdAt', 'desc'),
      ordersCollection.query([
        { field: 'userId', operator: '==', value: userId }
      ], 'createdAt', 'desc')
    ]);

    // Enrich tickets with event data (Name, Date, Image)
    const enrichedTickets = await Promise.all(tickets.map(async (ticket: any) => {
      let eventName = 'Evento desconocido';
      let eventDate = '';
      let eventImage = '/images/placeholder-event.jpg';
      let currency = ticket.currency || 'CLP';

      try {
        if (ticket.eventId) {
          const event = await eventsCollection.get(ticket.eventId);
          if (event) {
            eventName = event.name;
            eventDate = event.startDate;
            eventImage = event.mainImageUrl || eventImage;
            // Prefer event currency if ticket doesn't specify (though ticket usually should)
            if (!ticket.currency && event.currency) {
              currency = event.currency;
            }
          }
        }
      } catch (err) {
        console.warn(`Error fetching event ${ticket.eventId} for ticket ${ticket.id}`, err);
      }

      return {
        ...ticket,
        eventName,
        eventDate,
        eventImage,
        currency
        // ticketsCount: ticket.ticketItems.reduce((acc: number, item: any) => acc + item.quantity, 0) // Already have this logic in frontend or can do here
      };
    }));

    // Calculate Stats
    const totalTickets = enrichedTickets.length; // Or sum of quantities? UI suggests "Total Tickets" count usually means transactions or individual tix. 
    // Let's count actual tickets:
    const totalTicketsCount = enrichedTickets.reduce((acc, t) => acc + (t.ticketItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0), 0);

    const totalOrders = orders.length;
    // Favorites - placeholder logic as we don't have a favorites collection yet or fields on user
    const favoriteEvents = 0;

    return {
      success: true,
      data: {
        tickets: enrichedTickets,
        orders,
        stats: {
          totalTickets: totalTicketsCount,
          totalOrders,
          favoriteEvents
        }
      }
    };

  } catch (error: any) {
    console.error('Error fetching user profile data:', error);
    return { success: false, error: 'Error al cargar datos del perfil' };
  }
}

// Fix Legacy Data: Recalculate Installments
export async function recalculateTicketInstallments(ticketId: string) {
  'use server';
  await requireAdmin();

  try {
    const ticket = await ticketTransactionsCollection.get(ticketId);
    if (!ticket) throw new Error('Ticket not found');

    if (ticket.paymentType !== 'installment') throw new Error('Not an installment ticket');

    // 1. Calculate correct values
    const RESERVATION_FEE_PER_TICKET = 50;
    // Assuming ticketItems contains quantity info. If not, fallback to ticket.quantity
    let quantity = ticket.quantity || 1;
    if (ticket.ticketItems && ticket.ticketItems.length > 0) {
      quantity = ticket.ticketItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
    }

    const correctReservationTotal = RESERVATION_FEE_PER_TICKET * quantity;
    const itemsTotal = ticket.totalAmount; // This should be correct (1490)
    const amountToFinance = itemsTotal - correctReservationTotal;

    // Get existing installments to know how many there are
    const installments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: ticketId }
    ]);

    // Filter out reservation (installmentNumber 0) to count actual installments
    const financeInstallments = installments.filter(i => i.installmentNumber > 0);
    const count = financeInstallments.length;

    if (count === 0) throw new Error('No finance installments found');

    const amountPerInstallment = amountToFinance / count;

    // 2. Update Documents
    const batch = [];

    // Update Reservation
    const reservationInst = installments.find(i => i.installmentNumber === 0);
    if (reservationInst) {
      await paymentInstallmentsCollection.update(reservationInst.id, {
        amount: correctReservationTotal
      });
    }

    // Update Finance Installments
    for (const inst of financeInstallments) {
      await paymentInstallmentsCollection.update(inst.id, {
        amount: amountPerInstallment
      });
    }

    return { success: true, message: `Recalculado: Reserva=${correctReservationTotal}, Cuotas=${amountPerInstallment}` };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
