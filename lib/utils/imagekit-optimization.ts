/**
 * ImageKit Optimization Service
 * Configuración para optimizar imágenes automáticamente
 */

export interface ImageKitConfig {
  publicKey: string;
  urlEndpoint: string;
}

// Configuración de ImageKit
export const imagekitConfig: ImageKitConfig = {
  publicKey: "public_j9JZyFZiCiTq7HgEdMrUintoFJw=",
  urlEndpoint: "https://ik.imagekit.io/tuncar"
};

/**
 * Genera URL optimizada de ImageKit con parámetros específicos
 */
export function optimizeImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    progressive?: boolean;
    blur?: number;
    watermark?: string;
  } = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'webp', // WebP es más amigable para SEO y reduce peso
    progressive = true,
    blur,
    watermark
  } = options;

  // Si ya es una URL de ImageKit, simplemente agrega parámetros
  if (originalUrl.includes(imagekitConfig.urlEndpoint)) {
    const separator = originalUrl.includes('?') ? '&' : '?';
    let transformation = 'tr:';
    
    if (width) transformation += `w-${width},`;
    if (height) transformation += `h-${height},`;
    if (quality) transformation += `q-${quality},`;
    if (format) transformation += `fo-${format},`;
    if (progressive) transformation += `pr-true,`;
    if (blur) transformation += `bl-${blur},`;
    
    // Remover coma final
    transformation = transformation.replace(/,$/, '');
    
    return `${originalUrl}${separator}${transformation}`;
  }

  // Si es una URL de Firebase Storage, convertirla a ImageKit
  if (originalUrl.includes('firebasestorage.googleapis.com')) {
    // Extraer el path del archivo
    const urlParts = originalUrl.split('/o/');
    if (urlParts.length < 2) return originalUrl;
    
    const filePath = urlParts[1].split('?')[0];
    // Decodificar URL
    const decodedPath = decodeURIComponent(filePath);
    
    let transformation = 'tr:';
    
    if (width) transformation += `w-${width},`;
    if (height) transformation += `h-${height},`;
    if (quality) transformation += `q-${quality},`;
    if (format) transformation += `fo-${format},`;
    if (progressive) transformation += `pr-true,`;
    if (blur) transformation += `bl-${blur},`;
    
    // Remover coma final
    transformation = transformation.replace(/,$/, '');
    
    return `${imagekitConfig.urlEndpoint}/${decodedPath}?${transformation}`;
  }

  // Para otros tipos de URLs, intentar procesarlas
  const separator = originalUrl.includes('?') ? '&' : '?';
  let transformation = 'tr:';
  
  if (width) transformation += `w-${width},`;
  if (height) transformation += `h-${height},`;
  if (quality) transformation += `q-${quality},`;
  if (format) transformation += `fo-${format},`;
  if (progressive) transformation += `pr-true,`;
  if (blur) transformation += `bl-${blur},`;
  
  transformation = transformation.replace(/,$/, '');
  
  return `${originalUrl}${separator}${transformation}`;
}

/**
 * Genera URLs optimizadas para diferentes usos
 */
export function getOptimizedImageUrls(originalUrl: string) {
  // Imagen para redes sociales (SEO)
  const socialImage = optimizeImageUrl(originalUrl, {
    width: 1200,
    height: 630,
    quality: 85,
    format: 'webp'
  });

  // Imagen para banner (pantalla completa)
  const bannerImage = optimizeImageUrl(originalUrl, {
    width: 1920,
    height: 1080,
    quality: 80,
    format: 'webp'
  });

  // Imagen thumbnail (miniatura)
  const thumbnailImage = optimizeImageUrl(originalUrl, {
    width: 300,
    height: 300,
    quality: 75,
    format: 'webp'
  });

  // Imagen responsive para web
  const webImage = optimizeImageUrl(originalUrl, {
    width: 800,
    quality: 80,
    format: 'webp'
  });

  return {
    original: originalUrl,
    social: socialImage,
    banner: bannerImage,
    thumbnail: thumbnailImage,
    web: webImage
  };
}

/**
 * Configuraciones predefinidas para diferentes tipos de imagen
 */
export const imagePresets = {
  // Para metadatos SEO y Open Graph
  seo: {
    width: 1200,
    height: 630,
    quality: 85,
    format: 'webp' as const
  },
  
  // Para banners y headers
  banner: {
    width: 1920,
    height: 1080,
    quality: 80,
    format: 'webp' as const
  },
  
  // Para galerías y contenido
  gallery: {
    width: 800,
    quality: 80,
    format: 'webp' as const
  },
  
  // Para thumbnails
  thumbnail: {
    width: 300,
    height: 300,
    quality: 75,
    format: 'webp' as const
  },
  
  // Para el evento principal (máxima calidad SEO)
  mainEvent: {
    width: 1200,
    height: 675,
    quality: 90,
    format: 'webp' as const
  }
};

/**
 * Valida si una URL es optimizable con ImageKit
 */
export function isOptimizableUrl(url: string): boolean {
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('ik.imagekit.io') ||
    url.startsWith('http') // ImageKit puede procesar la mayoría de URLs HTTP
  );
}

/**
 * Obtiene información de optimización para una imagen
 */
export function getImageOptimizationInfo(originalUrl: string) {
  const optimizedUrls = getOptimizedImageUrls(originalUrl);
  
  return {
    original: {
      url: originalUrl,
      estimatedSize: 'Variable (sin optimizar)'
    },
    optimized: {
      webp: optimizedUrls.web,
      seo: optimizedUrls.social,
      banner: optimizedUrls.banner,
      thumbnail: optimizedUrls.thumbnail,
      estimatedSizeReduction: '60-80%',
      format: 'WebP (SEO friendly)'
    },
    benefits: [
      'Reducción de peso del 60-80%',
      'Formato WebP compatible con SEO',
      'Entrega más rápida',
      'Mejor experiencia de usuario',
      'Optimización automática de calidad'
    ]
  };
}

/**
 * Constantes para ImageKit transformations
 */
export const IMAGEKIT_TRANSFORMATIONS = {
  // Formatos
  FORMAT: {
    WEBP: 'fo-webp',
    AVIF: 'fo-avif', 
    JPEG: 'fo-jpeg',
    PNG: 'fo-png'
  },
  
  // Calidad
  QUALITY: {
    HIGH: 'q-90',
    MEDIUM: 'q-80', 
    LOW: 'q-70',
    THUMBNAIL: 'q-75'
  },
  
  // Dimensiones comunes
  DIMENSIONS: {
    SOCIAL: { width: 1200, height: 630 },
    BANNER: { width: 1920, height: 1080 },
    GALLERY: { width: 800 },
    THUMBNAIL: { width: 300, height: 300 },
    MAIN_EVENT: { width: 1200, height: 675 }
  },
  
  // Efectos
  EFFECTS: {
    BLUR: 'bl-5',
    SHARPEN: 'sh-true',
    PROGRESSIVE: 'pr-true'
  }
};