/**
 * Server-side ImageKit utilities
 * Used for backend operations that require proper authentication
 */

export interface ImageKitUploadOptions {
  file: Buffer;
  fileName: string;
  folder?: string;
  tags?: string[];
}

export interface ImageKitUploadResponse {
  success: boolean;
  fileId?: string;
  filePath?: string;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Upload file to ImageKit using server-side authentication
 */
export async function uploadToImageKitServer(
  options: ImageKitUploadOptions
): Promise<ImageKitUploadResponse> {
  const { file, fileName, folder = 'djs', tags = [] } = options;

  try {
    // Prepare form data
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(file);
    formData.append('file', new Blob([uint8Array], { type: 'image/jpeg' }), fileName);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    // Get ImageKit private key from environment
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      return {
        success: false,
        error: 'ImageKit private key not configured'
      };
    }

    // Upload to ImageKit
    const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(privateKey + ':').toString('base64')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      fileId: result.fileId,
      filePath: result.filePath,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl
    };

  } catch (error) {
    console.error('ImageKit server upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Generate optimized ImageKit URL with correct syntax
 */
export function generateImageKitUrl(
  filePath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    progressive?: boolean;
  } = {}
): string {
  const {
    width = 1200,
    height = 675,
    quality = 90,
    format = 'webp',
    progressive = true
  } = options;

  // Build transformation parameters with CORRECT syntax
  const transformations = [
    `w-${width}`,
    `h-${height}`,
    `q-${quality}`,
    `f-${format}`, // Note: f- not fo-
  ];

  // Add progressive only for JPEG
  if (progressive && format === 'jpeg') {
    transformations.push('pr-true');
  }

  const baseUrl = 'https://ik.imagekit.io/tuncar';
  return `${baseUrl}/${filePath}?tr=${transformations.join(',')}`;
}

/**
 * Validate ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  return url.includes('ik.imagekit.io');
}

/**
 * Extract file path from ImageKit URL
 */
export function extractImageKitPath(imageKitUrl: string): string | null {
  try {
    const url = new URL(imageKitUrl);
    const pathParts = url.pathname.split('/');
    return pathParts.slice(1).join('/');
  } catch {
    return null;
  }
}