import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection, eventsCollection } from '@/lib/firebase/collections';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { requireAdmin } from '@/lib/auth-admin';
import { createNotification } from '@/lib/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    const formData = await request.formData();
    const transactionId = formData.get('transactionId') as string;
    const eventId = formData.get('eventId') as string;
    const files = formData.getAll('files') as File[];
    const fileTypes = formData.getAll('fileTypes') as string[]; // 'qr' o 'file'
    const availableDate = formData.get('availableDate') as string | null;
    const makeAvailableImmediately = formData.get('makeAvailableImmediately') === 'true';
    const updateEventDate = formData.get('updateEventDate') === 'true';

    if (!transactionId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Transaction ID and files are required' },
        { status: 400 }
      );
    }

    // Verify transaction exists and payment is fully approved
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.ticketDeliveryMode !== 'manualUpload') {
      return NextResponse.json(
        { error: 'Transaction does not require manual upload' },
        { status: 400 }
      );
    }

    // Validate payment is completely approved before allowing upload
    const { calculatePaymentAggregate } = await import('@/lib/payments/ticket-payment-state');
    const aggregate = await calculatePaymentAggregate({ ...transaction, id: transactionId } as any);

    if (!aggregate.canDeliverTickets) {
      return NextResponse.json(
        {
          error: 'Payment not fully approved',
          details: {
            paymentStatus: aggregate.paymentStatus,
            approvedCount: aggregate.approvedCount,
            pendingCount: aggregate.pendingCount,
            requiresReconciliation: aggregate.requiresReconciliation,
          }
        },
        { status: 400 }
      );
    }

    // Upload files to Firebase Storage
    const uploadedFiles: Array<{
      fileUrl: string;
      fileName: string;
      uploadedBy: string;
      uploadedAt: string;
      availableDate?: string;
      mimeType?: string;
      fileType: 'qr' | 'file'; // Nuevo campo
    }> = [];

    const adminUser = await requireAdmin();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = fileTypes[i] || 'file'; // Por defecto 'file' si no se especifica
      // Validate file type
      if (fileType === 'qr') {
        // Para QR, solo imágenes
        if (!file.type.includes('image')) {
          return NextResponse.json(
            { error: 'QR files must be images' },
            { status: 400 }
          );
        }
      } else {
        // Para archivos completos, PDF o imágenes
        if (!file.type.includes('pdf') && !file.type.includes('image')) {
          return NextResponse.json(
            { error: 'Only PDF and image files are allowed' },
            { status: 400 }
          );
        }
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `tickets/${transactionId}/${fileName}`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await uploadBytes(storageRef, buffer, {
        contentType: file.type,
      });

      const downloadUrl = await getDownloadURL(storageRef);

      uploadedFiles.push({
        fileUrl: downloadUrl,
        fileName: file.name,
        uploadedBy: adminUser.id,
        uploadedAt: new Date().toISOString(),
        availableDate: makeAvailableImmediately ? undefined : (availableDate || transaction.ticketsDownloadAvailableDate),
        mimeType: file.type,
        fileType: fileType as 'qr' | 'file', // Agregar tipo
      });
    }

    // Determine delivery status based on availability date
    const now = new Date();
    const effectiveAvailableDate = makeAvailableImmediately ? null : (availableDate || transaction.ticketsDownloadAvailableDate);

    let newDeliveryStatus: 'scheduled' | 'available' | 'delivered' = 'available';

    if (effectiveAvailableDate) {
      const availableDateObj = new Date(effectiveAvailableDate);
      if (availableDateObj > now) {
        newDeliveryStatus = 'scheduled';
      } else {
        newDeliveryStatus = 'available';
      }
    }

    // Update transaction with uploaded files metadata
    await ticketTransactionsCollection.update(transactionId, {
      ticketsUploadedFiles: uploadedFiles,
      ticketsFiles: uploadedFiles.map(f => f.fileUrl), // Keep legacy field for compatibility
      ticketDeliveryStatus: newDeliveryStatus,
      deliveredAt: newDeliveryStatus === 'available' ? new Date() : undefined,
      updatedAt: new Date(),
    });

    // Update event date if requested
    let eventUpdated = false;
    if (updateEventDate && eventId) {
      try {
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (makeAvailableImmediately) {
          // Remove or set to null to indicate immediate availability
          updateData.ticketDownloadAvailableDate = null;
        } else if (effectiveAvailableDate) {
          updateData.ticketDownloadAvailableDate = effectiveAvailableDate;
        }

        await eventsCollection.update(eventId, updateData);
        eventUpdated = true;
      } catch (eventError) {
        console.error('Error updating event date:', eventError);
        // Don't fail the whole operation if event update fails
      }
    }

    // Send notification to user only if immediately available
    if (newDeliveryStatus === 'available') {
      await createNotification({
        userId: transaction.userId,
        title: '🎉 Tickets Entregados',
        body: 'Tus tickets están listos para descargar.',
        type: 'general',
        orderId: transactionId
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Tickets uploaded successfully',
      files: uploadedFiles,
      deliveryStatus: newDeliveryStatus,
      eventUpdated
    });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;

  } catch (error) {
    console.error('Error uploading manual tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}