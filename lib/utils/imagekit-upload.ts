'use client';

/**
 * ImageKit Direct Upload Utility
 * Uploads files directly to ImageKit for better performance and SEO
 */

interface ImageKitUploadResponse {
  success: boolean;
  fileId?: string;
  filePath?: string;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export class ImageKitUploadError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ImageKitUploadError';
  }
}

export async function uploadToImageKit(
  file: File,
  options: {
    folder?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<ImageKitUploadResponse> {
  const {
    folder = 'djs',
    tags = [],
    useUniqueFileName = true,
    onProgress
  } = options;

  try {
    // Create unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = useUniqueFileName 
      ? `${timestamp}_${randomString}.${extension}`
      : file.name;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    formData.append('folder', folder);
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }

    // Upload to ImageKit
    const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    
    // Note: This uses the public key. In production, consider using a server-side upload token
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('public_j9JZyFZiCiTq7HgEdMrUintoFJw=:'),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ImageKitUploadError(
        `Upload failed: ${response.statusText}`,
        response.status.toString()
      );
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
    console.error('ImageKit upload error:', error);
    return {
      success: false,
      error: error instanceof ImageKitUploadError 
        ? error.message 
        : 'Unknown upload error'
    };
  }
}

/**
 * Get optimized ImageKit URL
 */
export function getOptimizedImageKitUrl(
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

  // Base ImageKit URL
  const baseUrl = 'https://ik.imagekit.io/tuncar';
  
  // Build transformation parameters
  const transformations = [
    `w-${width}`,
    `h-${height}`,
    `q-${quality}`,
    `f-${format}`,
    ...(progressive && format === 'jpeg' ? ['pr-true'] : [])
  ];

  return `${baseUrl}/${filePath}?tr=${transformations.join(',')}`;
}

/**
 * Generate responsive ImageKit URLs
 */
export function getResponsiveImageKitUrls(filePath: string) {
  return {
    thumbnail: getOptimizedImageKitUrl(filePath, {
      width: 300,
      height: 300,
      quality: 75,
      format: 'webp'
    }),
    mobile: getOptimizedImageKitUrl(filePath, {
      width: 800,
      height: 450,
      quality: 80,
      format: 'webp'
    }),
    tablet: getOptimizedImageKitUrl(filePath, {
      width: 1024,
      height: 576,
      quality: 85,
      format: 'webp'
    }),
    desktop: getOptimizedImageKitUrl(filePath, {
      width: 1200,
      height: 675,
      quality: 90,
      format: 'webp'
    }),
    original: getOptimizedImageKitUrl(filePath, {
      width: 1920,
      height: 1080,
      quality: 95,
      format: 'webp'
    })
  };
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
    // Remove the first empty string and 'tr' if present
    return pathParts.slice(1).join('/');
  } catch {
    return null;
  }
}