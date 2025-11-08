import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'djs';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📁 Processing upload:', file.name, 'Size:', file.size, 'Folder:', folder);

    // Get ImageKit credentials from environment
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    console.log('🔐 ImageKit credentials check:', {
      hasPrivateKey: !!privateKey,
      hasPublicKey: !!publicKey,
      hasUrlEndpoint: !!urlEndpoint,
      privateKeyLength: privateKey?.length || 0,
      publicKeyLength: publicKey?.length || 0,
      urlEndpoint: urlEndpoint
    });

    if (!privateKey || !publicKey || !urlEndpoint) {
      console.error('❌ Missing ImageKit credentials:', {
        privateKey: !!privateKey,
        publicKey: !!publicKey,
        urlEndpoint: !!urlEndpoint
      });
      return NextResponse.json(
        { error: 'ImageKit credentials not configured', details: { privateKey: !!privateKey, publicKey: !!publicKey, urlEndpoint: !!urlEndpoint } },
        { status: 500 }
      );
    }

    // Create unique filename
    const uploadTimestamp = Date.now();
    const signatureTimestamp = Math.floor(Date.now() / 1000);
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const finalFileName = `${uploadTimestamp}_${randomString}.${extension}`;
    const filePath = `${folder}/${finalFileName}`;

    console.log('📄 Generated file path:', filePath);

    // Create signature for ImageKit upload (using correct method)
    const signature = crypto
      .createHash('sha256')
      .update(privateKey + filePath + signatureTimestamp)
      .digest('hex');

    // Create new FormData for ImageKit
    const imageKitFormData = new FormData();
    imageKitFormData.append('file', file);
    imageKitFormData.append('fileName', finalFileName);
    imageKitFormData.append('folder', folder);
    imageKitFormData.append('tags', 'ravehub,dj,upload');
    imageKitFormData.append('useUniqueFileName', 'true');
    imageKitFormData.append('timestamp', signatureTimestamp.toString());
    imageKitFormData.append('signature', signature);

    console.log('🚀 Uploading to ImageKit with signature...');
    console.log('📊 Upload data:', {
      fileName: finalFileName,
      folder: folder,
      timestamp: signatureTimestamp,
      signature: signature
    });

    // Upload to ImageKit using multipart/form-data with signature
    const imageKitResponse = await fetch('https://api.imagekit.io/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(publicKey + ':' + privateKey).toString('base64')}`
      },
      body: imageKitFormData
    });

    if (!imageKitResponse.ok) {
      const errorData = await imageKitResponse.text();
      console.error('❌ ImageKit upload failed:', errorData);
      throw new Error(`ImageKit upload failed: ${imageKitResponse.status} ${errorData}`);
    }

    const uploadResult = await imageKitResponse.json();
    console.log('✅ ImageKit upload successful:', uploadResult);

    // Return standardized response
    const response = {
      success: true,
      fileId: uploadResult.fileId,
      filePath: uploadResult.filePath,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        originalName: file.name
      }
    };

    console.log('✅ Returning ImageKit response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ ImageKit upload error:', error);
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}