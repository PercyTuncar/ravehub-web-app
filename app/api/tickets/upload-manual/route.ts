import { NextRequest, NextResponse } from 'next/server';
import { ticketTransactionsCollection } from '@/lib/firebase/collections';
// TODO: Import storage utilities
// import { uploadToStorage } from '@/lib/firebase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transactionId = formData.get('transactionId') as string;
    const files = formData.getAll('files') as File[];

    if (!transactionId || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Transaction ID and files are required' },
        { status: 400 }
      );
    }

    // Verify transaction exists and is approved
    const transaction = await ticketTransactionsCollection.get(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Transaction not approved yet' },
        { status: 400 }
      );
    }

    if (transaction.ticketDeliveryMode !== 'manualUpload') {
      return NextResponse.json(
        { error: 'Transaction does not require manual upload' },
        { status: 400 }
      );
    }

    // Upload files to Firebase Storage
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        return NextResponse.json(
          { error: 'Only PDF and image files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }

      // TODO: Upload to Firebase Storage
      // const url = await uploadToStorage(file, `tickets/${transactionId}/${file.name}`);
      // uploadedUrls.push(url);

      // For now, simulate upload
      const mockUrl = `https://storage.googleapis.com/ravehub-tickets/${transactionId}/${file.name}`;
      uploadedUrls.push(mockUrl);
    }

    // Update transaction with file URLs and mark as delivered
    await ticketTransactionsCollection.update(transactionId, {
      ticketsFiles: uploadedUrls,
      ticketDeliveryStatus: 'delivered',
      deliveredAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Send notification to user

    const response = NextResponse.json({
      success: true,
      message: 'Tickets uploaded successfully',
      files: uploadedUrls
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