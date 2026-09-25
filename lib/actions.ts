/**
 * Server Actions with revalidation for critical updates
 */

'use server';

import { blogCollection, eventsCollection, productsCollection, blogCommentsCollection, ticketTransactionsCollection, paymentInstallmentsCollection, usersCollection, ordersCollection, commitAdminBatch, createAdminDocumentId } from '@/lib/firebase/admin-collections';
import { createNotification, InstallmentNotifications, OrderNotifications } from '@/lib/utils/notifications';
import { revalidateBlogPost, revalidateBlogListing, revalidateEvent, revalidateEventsListing, revalidateProduct, revalidateShopListing, revalidateCommentApproval, revalidateProductStock, revalidateEventCapacity } from '@/lib/revalidate';
import { BlogPost, Event, Product, BlogComment } from '@/lib/types';
import { requireAdmin, requireAuth, getCurrentUser } from '@/lib/auth-admin';
import { sendConfirmedPurchaseForEntity } from '@/lib/analytics/server-events';


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
 * Server action to approve/reject blog comment with revalidation.
 *
 * BlogComment uses `isApproved: boolean` (not a `status` string field).
 * Post lookup uses `postId` to find the post and then its slug for revalidation.
 */
export async function updateCommentStatus(commentId: string, status: 'approved' | 'rejected' | 'pending') {
  try {
    await requireAdmin();

    const isApproved = status === 'approved';

    await blogCommentsCollection.update(commentId, {
      isApproved,
      updatedAt: new Date().toISOString(),
      ...(isApproved && { approvedAt: new Date().toISOString() }),
    });

    // Fetch the comment to get `postId`, then look up the post slug for revalidation.
    // BlogComment has `postId` (string), NOT `postSlug`.
    const comment = await blogCommentsCollection.get(commentId);
    if (comment?.postId) {
      const post = await blogCollection.get(comment.postId);
      if (post?.slug) {
        await revalidateCommentApproval(post.slug);
      }
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
    // Check auth but don't redirect
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify ownership
    const ticket = await ticketTransactionsCollection.get(ticketId);
    if (!ticket) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    if (ticket.userId !== currentUser.id) {
      return { success: false, error: 'No autorizado: este ticket pertenece a otro usuario' };
    }

    // User can only update proof, not approval/status/amounts/delivery
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
            await sendConfirmedPurchaseForEntity('ticket', ticketId);
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
          await sendConfirmedPurchaseForEntity('ticket', ticketId);
          return { success: true };
        }

      } else {
        // Full Payment: Approve Transaction
        await ticketTransactionsCollection.update(ticketId, {
          paymentStatus: 'approved',
          updatedAt: new Date().toISOString()
        });
        await sendConfirmedPurchaseForEntity('ticket', ticketId);

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
  reservationAmountPerTicket?: number;
  reservationSubtotal?: number;
  paymentType: 'full' | 'installment';
  paymentMethod: string;
  reservationAmount?: number;
  installmentsCount?: number;
  firstInstallmentDate?: string; // ISO String
  paymentStatus: 'pending' | 'approved';
  ticketsDownloadAvailableDate?: string; // ISO String
  paidInstallmentsIndices?: number[]; // -1 for reservation, 0+ for installments
  installmentProofs?: Record<number, string>; // { -1: "url1", 0: "url2", ... }
  installmentPaymentDates?: Record<number, string>; // ✅ NUEVO: { -1: "2024-08-05", 0: "2024-09-05", ... }
}): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  const startTime = Date.now();
  const callId = Math.random().toString(36).substring(7);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎫 [CREATE_MANUAL_TICKET ${callId}] Inicio de creación de ticket manual`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`👤 Usuario: ${data.userId}`);
  console.log(`🎉 Evento: ${data.eventId}`);
  console.log(`💰 Monto Total: ${data.totalAmount}`);
  console.log(`📋 Tipo de Pago: ${data.paymentType}`);
  if (data.paymentType === 'installment') {
    console.log(`📊 Cuotas: ${data.installmentsCount}`);
    console.log(`💵 Adelanto: ${data.reservationAmount}`);
  }
  console.log(`${'='.repeat(80)}\n`);

  try {
    await requireAdmin();

    // Resolve event currency — never fall back silently to a hardcoded value.
    // Fetching the event also lets us validate it exists before creating the ticket.
    const event = await eventsCollection.get(data.eventId);
    if (!event) throw new Error(`Event ${data.eventId} not found`);
    const eventCurrency = event.currency || 'PEN';
    const effectiveDownloadDate = data.ticketsDownloadAvailableDate || event.ticketDownloadAvailableDate || undefined;

    // 1. Create Ticket Transaction
    const ticketItem = {
      zoneId: data.zoneId,
      zoneName: data.zoneName,
      phaseId: data.phaseId,
      phaseName: data.phaseName,
      quantity: data.quantity,
      pricePerTicket: data.unitPrice,
      totalAmount: data.unitPrice * data.quantity,
      ...(data.reservationAmountPerTicket !== undefined
        ? { reservationAmountPerTicket: data.reservationAmountPerTicket }
        : {}),
      ...(data.reservationSubtotal !== undefined
        ? { reservationSubtotal: data.reservationSubtotal }
        : {}),
    };

    const ticketData: any = {
      userId: data.userId,
      eventId: data.eventId,
      ticketItems: [ticketItem],
      totalAmount: data.totalAmount,
      currency: eventCurrency,
      paymentMethod: data.paymentMethod,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      ticketDeliveryMode: 'manualUpload',
      ticketDeliveryStatus: 'pending',
      ...(effectiveDownloadDate
        ? { ticketsDownloadAvailableDate: effectiveDownloadDate }
        : {}),
      isCourtesy: data.paymentMethod === 'courtesy',
      createdAt: new Date().toISOString()
    };

    if (data.paymentType === 'installment') {
      if (!data.installmentsCount || !data.firstInstallmentDate) {
        throw new Error('Las compras en cuotas requieren cantidad y fecha de cuotas');
      }

      ticketData.installments = data.installmentsCount;
      ticketData.reservationAmount = data.reservationAmount;
    }

    const ticketId = await createAdminDocumentId('ticketTransactions');
    console.log(`📝 [CREATE_MANUAL_TICKET ${callId}] Ticket ID generado: ${ticketId}`);

    const operations: Array<{ collection: string; id?: string; data: Record<string, any> }> = [
      { collection: 'ticketTransactions', id: ticketId, data: ticketData },
    ];
    console.log(`📦 [CREATE_MANUAL_TICKET ${callId}] Operación de ticket agregada al batch`);

    if (data.paymentType === 'installment') {
      const { calculateInstallmentPlan } = await import('@/lib/utils/admin-ticket-calculator');
      const { parseLocalDate } = await import('@/lib/utils/date');
      const plan = calculateInstallmentPlan(
        data.unitPrice * data.quantity,
        data.reservationAmount || 0,
        data.installmentsCount!,
        parseLocalDate(data.firstInstallmentDate!)
      );

      if (!plan.success || !plan.installments) {
        throw new Error(plan.error || 'No se pudo calcular el plan de cuotas');
      }

      const now = new Date().toISOString();
      console.log(`💳 [CREATE_MANUAL_TICKET ${callId}] Creando cuotas...`);

      if (data.reservationAmount && data.reservationAmount > 0) {
        const isReservationPaid = data.paidInstallmentsIndices?.includes(-1) ?? false;
        const reservationProof = data.installmentProofs?.[-1];
        const reservationPaymentDateStr = data.installmentPaymentDates?.[-1]; // ✅ String en formato YYYY-MM-DD

        // ✅ CORRECCIÓN: Usar parseLocalDate para mantener la fecha correcta sin shift de zona horaria
        const reservationPaymentDate = reservationPaymentDateStr
          ? parseLocalDate(reservationPaymentDateStr).toISOString() // Parsear como fecha local y convertir a ISO
          : now;

        console.log(`   💰 Adelanto Inicial (#0): ${data.reservationAmount} ${eventCurrency} - ${isReservationPaid ? 'PAGADO' : 'PENDIENTE'}${reservationPaymentDateStr ? ` - Fecha: ${reservationPaymentDateStr}` : ''}`);
        operations.push({
          collection: 'paymentInstallments',
          data: {
            transactionId: ticketId,
            installmentNumber: 0,
            amount: data.reservationAmount,
            currency: eventCurrency,
            dueDate: now,
            status: isReservationPaid ? 'paid' : 'pending',
            adminApproved: isReservationPaid,
            originalPhaseId: data.phaseId, // Track original phase
            ...(isReservationPaid ? {
              paidAt: reservationPaymentDate, // ✅ ISO String con fecha local preservada
              approvedAt: now,
              actualPaymentDate: reservationPaymentDate // ✅ ISO String con fecha local preservada
            } : {}),
            ...(reservationProof ? { proofUrl: reservationProof } : {}),
          },
        });
      }

      for (const [index, installment] of plan.installments.entries()) {
        const isPaid = data.paidInstallmentsIndices?.includes(index) ?? false;
        const proof = data.installmentProofs?.[index];
        const paymentDateStr = data.installmentPaymentDates?.[index]; // ✅ String en formato YYYY-MM-DD

        // ✅ CORRECCIÓN: Usar parseLocalDate para mantener la fecha correcta sin shift de zona horaria
        const paymentDate = paymentDateStr
          ? parseLocalDate(paymentDateStr).toISOString() // Parsear como fecha local y convertir a ISO
          : now;

        console.log(`   💳 Cuota #${installment.installmentNumber}: ${installment.amount} ${eventCurrency} - ${isPaid ? 'PAGADO' : 'PENDIENTE'}${paymentDateStr ? ` - Fecha: ${paymentDateStr}` : ''}`);
        operations.push({
          collection: 'paymentInstallments',
          data: {
            transactionId: ticketId,
            installmentNumber: installment.installmentNumber,
            amount: installment.amount,
            currency: eventCurrency,
            dueDate: installment.dueDate.toISOString(),
            status: isPaid ? 'paid' : 'pending',
            adminApproved: isPaid,
            originalPhaseId: data.phaseId, // Track original phase
            originalAmount: installment.amount, // Track original amount
            ...(isPaid ? {
              paidAt: paymentDate, // ✅ ISO String con fecha local preservada
              approvedAt: now,
              actualPaymentDate: paymentDate // ✅ ISO String con fecha local preservada
            } : {}),
            ...(proof ? { proofUrl: proof } : {}),
          },
        });
      }
      console.log(`✅ [CREATE_MANUAL_TICKET ${callId}] Total de operaciones de cuotas: ${operations.length - 1}`);
    }

    console.log(`🚀 [CREATE_MANUAL_TICKET ${callId}] Ejecutando batch con ${operations.length} operaciones...`);
    await commitAdminBatch(operations);
    console.log(`✅ [CREATE_MANUAL_TICKET ${callId}] Batch ejecutado exitosamente`);

    if (data.paymentType === 'installment') {
      const { syncTransactionFromSchedule } = await import('@/lib/payments/ticket-payment-state');
      const syncResult = await syncTransactionFromSchedule(ticketId);
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'No se pudo sincronizar el estado de pago');
      }
    }

    // 3. If payment is full and approved, recalculate delivery eligibility
    if (data.paymentType === 'full' && data.paymentStatus === 'approved') {
      const { canDeliverTickets } = await import('@/lib/payments/ticket-payment-state');
      const transaction = await ticketTransactionsCollection.get(ticketId);
      if (transaction) {
        const deliveryEligible = await canDeliverTickets({ ...transaction, id: ticketId } as any);
        if (deliveryEligible) {
          await ticketTransactionsCollection.update(ticketId, {
            ticketDeliveryStatus: 'pending', // Admin still needs to upload files for manualUpload mode
          });
        }
      }
    }

    // 4. Create notification for user
    const selectedEvent = await eventsCollection.get(data.eventId);
    await createNotification({
      userId: data.userId,
      title: '🎟️ Ticket Asignado',
      body: `Se te ha asignado ${data.quantity} ticket(s) para ${selectedEvent?.name || 'el evento'}`,
      type: 'general',
      orderId: ticketId
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ [CREATE_MANUAL_TICKET ${callId}] Ticket creado exitosamente`);
    console.log(`📝 Ticket ID: ${ticketId}`);
    console.log(`⏱️  Duración: ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);

    return { success: true, ticketId };
  } catch (error: any) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [CREATE_MANUAL_TICKET ${callId}] Error creating manual ticket:`, error);
    console.error('❌ [CREATE_MANUAL_TICKET] Error stack:', error.stack);
    console.error('❌ [CREATE_MANUAL_TICKET] Input data:', JSON.stringify(data, null, 2));
    console.error(`${'='.repeat(80)}\n`);
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
    // NOTE: The relation field is `transactionId` (see PaymentInstallment type & all create calls).
    // The previous value `ticketTransactionId` never matched, leaving orphaned installments.
    const installments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: ticketId }
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
 * Count tickets for an event (to show admin how many would be affected)
 */
export async function countTicketsForEvent(eventId: string): Promise<{
  success: boolean;
  total: number;
  withOverrides: number;
  error?: string;
}> {
  'use server';

  try {
    await requireAdmin();

    const tickets = await ticketTransactionsCollection.query([
      { field: 'eventId', operator: '==', value: eventId }
    ]);

    const withOverrides = tickets.filter(t => t.ticketsDownloadAvailableDate).length;

    return {
      success: true,
      total: tickets.length,
      withOverrides
    };
  } catch (error: any) {
    console.error('Error counting tickets:', error);
    return {
      success: false,
      total: 0,
      withOverrides: 0,
      error: error.message || 'Error al contar tickets'
    };
  }
}

/**
 * Get all tickets for admin with related data (events and users)
 */
/**
 * Get tickets for admin with optional server-side filtering
 * ✅ OPTIMIZADO: Soporta filtros server-side para búsquedas eficientes
 */
export async function getTicketsForAdmin(filters?: {
  searchTerm?: string;
  statusFilter?: string;
  paymentFilter?: string;
  eventFilter?: string;
  deliveryFilter?: string;
  proofFilter?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  tickets: any[];
  error?: string;
}> {
  'use server';

  try {
    await requireAdmin();

    // Build Firestore query conditions based on filters
    const conditions: Array<{ field: string; operator: any; value: any }> = [];

    // Status filter (exact match)
    if (filters?.statusFilter && filters.statusFilter !== 'all') {
      conditions.push({
        field: 'paymentStatus',
        operator: '==',
        value: filters.statusFilter
      });
    }

    // Payment method filter (exact match)
    if (filters?.paymentFilter && filters.paymentFilter !== 'all') {
      conditions.push({
        field: 'paymentMethod',
        operator: '==',
        value: filters.paymentFilter
      });
    }

    // Event filter (exact match)
    if (filters?.eventFilter && filters.eventFilter !== 'all') {
      conditions.push({
        field: 'eventId',
        operator: '==',
        value: filters.eventFilter
      });
    }

    // Delivery status filter
    if (filters?.deliveryFilter && filters.deliveryFilter !== 'all') {
      if (filters.deliveryFilter === 'pending') {
        // Sin archivos o pending
        conditions.push({
          field: 'ticketDeliveryStatus',
          operator: 'in',
          value: ['pending', null]
        });
      } else if (filters.deliveryFilter === 'available') {
        // Archivos subidos
        conditions.push({
          field: 'ticketDeliveryStatus',
          operator: 'in',
          value: ['available', 'delivered']
        });
      }
    }

    // Proof filter (has payment proof or not)
    if (filters?.proofFilter && filters.proofFilter !== 'all') {
      if (filters.proofFilter === 'hasProof') {
        conditions.push({
          field: 'paymentProofUrl',
          operator: '!=',
          value: null
        });
      }
      // Note: 'noProof' filter is handled client-side as Firestore doesn't support "== null" well
    }

    // Determine limit: default 500 tickets, or custom limit
    const queryLimit = filters?.limit || 500;

    // Fetch tickets with conditions
    const allTickets = await ticketTransactionsCollection.query(
      conditions,
      'createdAt',
      'desc',
      queryLimit
    );

    // ✅ CORRECCIÓN: Cargar usuarios ANTES de filtrar para poder buscar por sus campos
    // Collect unique user IDs from all tickets
    const userIds = new Set<string>();
    allTickets.forEach(ticket => {
      if (ticket.userId) userIds.add(ticket.userId);
    });

    // Load users in batch
    const users = await usersCollection.getByIds(Array.from(userIds));
    const userMap = new Map(users.map(u => [u.id, u]));

    // Client-side filtering for search term and proof filter
    let filteredTickets = allTickets;

    // Search filter (client-side for flexibility - searches across multiple fields)
    if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filteredTickets = filteredTickets.filter(ticket => {
        // Get user data for additional search fields
        const user = userMap.get(ticket.userId);

        return (
          // Search by ticket ID
          ticket.id?.toLowerCase().includes(searchLower) ||
          // Search by event name
          ticket.eventName?.toLowerCase().includes(searchLower) ||
          // Search by user email
          ticket.userEmail?.toLowerCase().includes(searchLower) ||
          // Search by user name
          ticket.userName?.toLowerCase().includes(searchLower) ||
          // Search by user first name
          user?.firstName?.toLowerCase().includes(searchLower) ||
          // Search by user last name
          user?.lastName?.toLowerCase().includes(searchLower) ||
          // Search by full name (firstName + lastName)
          `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase().includes(searchLower) ||
          // Search by document number (DNI, etc.)
          user?.documentNumber?.toLowerCase().includes(searchLower) ||
          // Search by phone number
          user?.phone?.toLowerCase().includes(searchLower) ||
          // Search by phone with prefix
          `${user?.phonePrefix || ''}${user?.phone || ''}`.toLowerCase().replace(/\s/g, '').includes(searchLower.replace(/\s/g, ''))
        );
      });
    }

    // 'noProof' filter (client-side)
    if (filters?.proofFilter === 'noProof') {
      filteredTickets = filteredTickets.filter(ticket => !ticket.paymentProofUrl);
    }

    // Collect unique event IDs from filtered tickets
    const eventIds = new Set<string>();
    filteredTickets.forEach(ticket => {
      if (ticket.eventId) eventIds.add(ticket.eventId);
    });

    // ✅ Load events for filtered tickets only
    const events = await eventsCollection.getByIds(Array.from(eventIds));

    // Create lookup maps
    const eventMap = new Map(events.map(e => [e.id, e]));

    // Enrich tickets with event and user data
    const enrichedTickets = filteredTickets.map(ticket => ({
      ...ticket,
      eventName: eventMap.get(ticket.eventId)?.name || 'Evento desconocido',
      userEmail: userMap.get(ticket.userId)?.email || 'Usuario desconocido',
      userName: userMap.get(ticket.userId)?.name || 'Sin nombre'
    }));

    return {
      success: true,
      tickets: enrichedTickets
    };
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return {
      success: false,
      tickets: [],
      error: error.message || 'Error al cargar tickets'
    };
  }
}

/**
 * Get real-time statistics from the database for admin dashboard
 */
export async function getTicketStats(): Promise<{
  success: boolean;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalSales: number;
    currency: string;
  };
  error?: string;
}> {
  'use server';

  try {
    await requireAdmin();

    // ✅ OPTIMIZACIÓN: Usar count() para totales sin traer todos los documentos
    // Hacer queries en paralelo para cada estado
    const [totalCount, pendingTickets, approvedTickets, rejectedTickets] = await Promise.all([
      ticketTransactionsCollection.count([]),
      ticketTransactionsCollection.query([{ field: 'paymentStatus', operator: '==', value: 'pending' }]),
      ticketTransactionsCollection.query([{ field: 'paymentStatus', operator: '==', value: 'approved' }]),
      ticketTransactionsCollection.query([{ field: 'paymentStatus', operator: '==', value: 'rejected' }])
    ]);

    // Calcular ventas totales solo con tickets aprobados (ya filtrados)
    const totalSales = approvedTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const stats = {
      total: totalCount,
      pending: pendingTickets.length,
      approved: approvedTickets.length,
      rejected: rejectedTickets.length,
      totalSales,
      currency: 'PEN'
    };

    return {
      success: true,
      stats
    };
  } catch (error: any) {
    console.error('Error fetching ticket stats:', error);
    return {
      success: false,
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalSales: 0,
        currency: 'PEN'
      },
      error: error.message || 'Error al cargar estadísticas'
    };
  }
}

/**
 * Sync event download date to all existing tickets
 * Used when admin changes event date and wants to apply it to all tickets
 */
export async function syncEventDownloadDateToTickets(
  eventId: string,
  newDownloadDate: string | null,
  clearTicketOverrides: boolean
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  'use server';

  try {
    await requireAdmin();

    // Get all tickets for this event
    const tickets = await ticketTransactionsCollection.query([
      { field: 'eventId', operator: '==', value: eventId }
    ]);

    if (tickets.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    // Update tickets in parallel
    const updatePromises = tickets.map(async (ticket) => {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      };

      if (clearTicketOverrides) {
        // Remove individual ticket override to use event date
        updateData.ticketsDownloadAvailableDate = null;
      } else {
        // Set ticket date to match event date (creates snapshot)
        updateData.ticketsDownloadAvailableDate = newDownloadDate;
      }

      return ticketTransactionsCollection.update(ticket.id, updateData);
    });

    await Promise.all(updatePromises);

    return { success: true, updatedCount: tickets.length };
  } catch (error: any) {
    console.error('Error syncing event date to tickets:', error);
    return { success: false, updatedCount: 0, error: error.message || 'Error al sincronizar fechas' };
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

  // Check auth but don't redirect
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'No autenticado' };
  }

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

/**
 * ✅ NUEVA FUNCIÓN: Get installments for multiple tickets at once (optimized)
 * Carga todas las cuotas de múltiples tickets en una sola query
 */
export async function getBulkTicketInstallments(transactionIds: string[]): Promise<{
  success: boolean;
  installments?: any[];
  error?: string;
}> {
  'use server';

  try {
    await requireAdmin();

    if (transactionIds.length === 0) {
      return { success: true, installments: [] };
    }

    // Firestore 'in' operator límite: 30 valores
    // Si hay más de 30 tickets, dividir en batches
    const batchSize = 30;
    const allInstallments: any[] = [];

    for (let i = 0; i < transactionIds.length; i += batchSize) {
      const batchIds = transactionIds.slice(i, i + batchSize);

      const batchInstallments = await paymentInstallmentsCollection.query([
        { field: 'transactionId', operator: 'in', value: batchIds }
      ]);

      allInstallments.push(...batchInstallments);
    }

    // Sort by transactionId and installmentNumber
    const sorted = allInstallments.sort((a, b) => {
      if (a.transactionId !== b.transactionId) {
        return a.transactionId.localeCompare(b.transactionId);
      }
      return a.installmentNumber - b.installmentNumber;
    });

    return { success: true, installments: sorted };
  } catch (error: any) {
    console.error('Error fetching bulk installments:', error);
    return { success: false, error: error.message || 'Error al cargar las cuotas' };
  }
}

// --- Installment Proofs Management ---

export async function getPendingInstallments() {
  'use server';
  await requireAdmin();
  try {
    // ✅ CAMBIO: Query directo por estado 'pending-approval'
    const installments = await paymentInstallmentsCollection.query([
      { field: 'status', operator: '==', value: 'pending-approval' }
    ]);

    // Ya no necesitamos filtro adicional - el estado es explícito
    const enriched = await Promise.all(installments.map(async (inst: any) => {
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

  // Check auth but don't redirect
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'No autenticado' };
  }

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // Verify ownership: user must own the parent transaction
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (!ticket) {
      return { success: false, error: 'Transacción padre no encontrada' };
    }

    if (ticket.userId !== currentUser.id) {
      return { success: false, error: 'No autorizado: esta cuota pertenece a otro usuario' };
    }

    // ✅ NUEVO: Validar que solo puede subir pending o rejected
    if (installment.status !== 'pending' && installment.status !== 'rejected') {
      return {
        success: false,
        error: 'Esta cuota ya fue procesada. No puedes subir un nuevo comprobante.'
      };
    }

    // ✅ NUEVO: Verificar que sea la siguiente cuota en orden
    const allInstallments = await paymentInstallmentsCollection.query([
      { field: 'transactionId', operator: '==', value: installment.transactionId }
    ]);

    const sortedInstallments = allInstallments.sort((a, b) => a.installmentNumber - b.installmentNumber);

    // Encontrar la primera cuota que NO está pagada ni en revisión
    const nextDueInstallment = sortedInstallments.find(inst =>
      inst.status !== 'paid' &&
      inst.status !== 'pending-approval' &&
      inst.adminApproved !== true
    );

    if (!nextDueInstallment || nextDueInstallment.id !== installmentId) {
      return {
        success: false,
        error: `Debes pagar las cuotas en orden. Actualmente debes pagar la cuota #${nextDueInstallment?.installmentNumber || '?'} primero.`
      };
    }

    // User can only update proof fields, not status/approval/amounts
    await paymentInstallmentsCollection.update(installmentId, {
      userUploadedProofUrl: downloadURL,
      userUploadedAt: new Date().toISOString(),
      status: 'pending-approval', // ✅ CAMBIO: Estado explícito en lugar de derivado
    });

    // Notify all admins so the proof shows up for review (in-app notification).
    try {
      const admins = await usersCollection.query([
        { field: 'role', operator: '==', value: 'admin' }
      ]);
      await Promise.all(
        admins.map((admin: any) =>
          createNotification({
            userId: admin.id,
            ...InstallmentNotifications.proofUploaded(installment.transactionId, installment.installmentNumber)
          })
        )
      );
    } catch (notifyError) {
      // Best-effort: never fail the upload because notifications failed
      console.error('Error notifying admins of new installment proof:', notifyError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error uploading proof:', error);
    return { success: false, error: error.message || 'Error al subir comprobante' };
  }
}

// Admin Action: Approve Proof
export async function approveInstallmentProof(
  installmentId: string,
  actualPaymentDate?: string // ISO string - actual date from payment proof (optional, defaults to today)
): Promise<{ success: boolean; error?: string; recalculated?: boolean }> {
  'use server';

  // ✅ CAMBIO: Capturar el usuario admin que aprueba
  const adminUser = await requireAdmin();

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // ✅ NUEVO: Validar que existe comprobante
    if (!installment.userUploadedProofUrl && !installment.proofUrl && !installment.paymentProofUrl) {
      return {
        success: false,
        error: 'No se puede aprobar: no hay comprobante de pago subido. El cliente debe subir el comprobante primero.'
      };
    }

    // Verify parent transaction exists
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (!ticket) {
      return { success: false, error: 'Transacción padre no encontrada - requiere reconciliación' };
    }

    // Determine the actual payment date
    const paymentDate = actualPaymentDate ? new Date(actualPaymentDate) : new Date();
    const now = new Date();

    // 1. Update the Installment
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'paid',
      adminApproved: true,
      paidAt: now.toISOString(), // When it was approved
      approvedAt: now.toISOString(),
      approvedBy: adminUser.id, // ✅ NUEVO: Registrar quién aprobó
      actualPaymentDate: paymentDate.toISOString(), // When it was actually paid (from proof)
      // Preserve user-uploaded proof as approved proof
      proofUrl: installment.userUploadedProofUrl || installment.proofUrl,
      paymentProofUrl: installment.userUploadedProofUrl || installment.proofUrl,
    });

    // 2. Recalculate remaining installment dates based on actual payment date
    const { recalculateRemainingInstallmentDates } = await import('@/lib/utils/installment-recalculator');
    const recalcResult = await recalculateRemainingInstallmentDates(
      installment.transactionId,
      paymentDate,
      installment.installmentNumber
    );

    if (!recalcResult.success) {
      console.error('Failed to recalculate installment dates:', recalcResult.error);
    }

    // 3. Recalculate parent transaction status from complete schedule
    const { syncTransactionFromSchedule } = await import('@/lib/payments/ticket-payment-state');
    const syncResult = await syncTransactionFromSchedule(installment.transactionId);

    if (!syncResult.success) {
      console.error('Failed to sync transaction after installment approval:', syncResult.error);
    }

    // 4. Notify user
    await createNotification({
      userId: ticket.userId,
      ...InstallmentNotifications.paymentApproved(ticket.id, installment.installmentNumber)
    });

    // 5. If all installments are now approved, notify completion
    if (syncResult.aggregate?.paymentStatus === 'approved') {
      await createNotification({
        userId: ticket.userId,
        title: '✅ Pago Completo',
        body: `Todas las cuotas de tu pedido han sido aprobadas.`,
        type: 'payment',
        orderId: ticket.id
      });
    }

    return {
      success: true,
      recalculated: recalcResult.success && recalcResult.updated > 0
    };
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

  // ✅ CAMBIO: Capturar el usuario admin que rechaza
  const adminUser = await requireAdmin();

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // Verify parent transaction exists
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (!ticket) {
      return { success: false, error: 'Transacción padre no encontrada - requiere reconciliación' };
    }

    // Preserve rejected proof in history; clear uploaded URL so user can retry
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'rejected',
      adminApproved: false,
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminUser.id, // ✅ NUEVO: Registrar quién rechazó
      rejectionReason: reason,
      // Keep userUploadedProofUrl as audit trail; UI checks status='rejected' for re-upload flow
    });

    // Recalculate parent status - rejection may change aggregate
    const { syncTransactionFromSchedule } = await import('@/lib/payments/ticket-payment-state');
    await syncTransactionFromSchedule(installment.transactionId);

    // Notify user
    await createNotification({
      userId: ticket.userId,
      ...InstallmentNotifications.paymentRejected(ticket.id, installment.installmentNumber, reason)
    });

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

  // ✅ CAMBIO: Capturar el usuario admin que revierte
  const adminUser = await requireAdmin();

  try {
    const installment = await paymentInstallmentsCollection.get(installmentId);
    if (!installment) {
      return { success: false, error: 'Cuota no encontrada' };
    }

    // Verify parent transaction exists
    const ticket = await ticketTransactionsCollection.get(installment.transactionId);
    if (!ticket) {
      return { success: false, error: 'Transacción padre no encontrada - requiere reconciliación' };
    }

    // Preserve reverted payment in audit trail
    await paymentInstallmentsCollection.update(installmentId, {
      status: 'rejected',
      adminApproved: false,
      paidAt: null,
      revertedAt: new Date().toISOString(),
      revertedBy: adminUser.id, // ✅ NUEVO: Registrar quién revirtió
      // Keep proof history for audit
    });

    // Recalculate parent - revoking an approved installment changes aggregate
    const { syncTransactionFromSchedule } = await import('@/lib/payments/ticket-payment-state');
    await syncTransactionFromSchedule(installment.transactionId);

    // Notify user
    await createNotification({
      userId: ticket.userId,
      title: '⚠️ Pago Anulado',
      body: `El pago de la cuota #${installment.installmentNumber} ha sido anulado por un administrador. Por favor revisa y sube el comprobante nuevamente.`,
      type: 'payment',
      orderId: ticket.id
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error reverting installment:', error);
    return { success: false, error: error.message || 'Error al anular el pago' };
  }
}

// --- User Profile Data ---

export async function getUserProfileData(userId: string) {
  'use server';

  // Verify auth - but don't redirect, just check
  const currentUser = await getCurrentUser();

  // If no user, return error instead of redirecting
  if (!currentUser) {
    return { success: false, error: 'No autenticado' };
  }

  // Ensure user is requesting their own data or is admin
  if (currentUser.id !== userId && currentUser.role !== 'admin') {
    return { success: false, error: 'No autorizado' };
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
      let currency = ticket.currency;

      try {
        if (ticket.eventId) {
          const event = await eventsCollection.get(ticket.eventId);
          if (event) {
            eventName = event.name;
            eventDate = event.startDate;
            eventImage = event.mainImageUrl || eventImage;
            if (!currency && event.currency) {
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
    // Determine per-ticket reservation amount from event if available
    let quantity = ticket.quantity || 1;
    if (ticket.ticketItems && ticket.ticketItems.length > 0) {
      quantity = ticket.ticketItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
    }

    let perTicket = 50;
    try {
      const evt = await eventsCollection.get(ticket.eventId);
      if (evt && evt.reservationAmount !== undefined && evt.reservationAmount !== null) {
        perTicket = evt.reservationAmount;
      }
    } catch (err) {
      console.warn('Unable to load event to determine reservation amount, falling back to 50', err);
    }

    const correctReservationTotal = perTicket * quantity;
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
