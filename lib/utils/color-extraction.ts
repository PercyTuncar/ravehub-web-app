export interface ColorPalette {
  dominant: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

/**
 * Extract dominant color from an image using Canvas API
 * More robust than ColorThief, works with CORS images
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Create a new image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Load the image
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
      img.src = imageUrl;
    });

    // Create canvas to extract colors
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return null;
    }

    // Set canvas size (smaller for performance)
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image to canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Extract color palette using simple color quantization
    const colorMap = new Map<string, number>();
    
    // Sample pixels (every 10th pixel for performance)
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Quantize colors (reduce to 32 levels per channel)
      const qr = Math.floor(r / 8) * 8;
      const qg = Math.floor(g / 8) * 8;
      const qb = Math.floor(b / 8) * 8;
      const key = `${qr},${qg},${qb}`;
      
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return [r, g, b] as [number, number, number];
      });

    if (sortedColors.length === 0) {
      return null;
    }

    // Get dominant color (first in sorted list)
    const dominant = sortedColors[0];
    const accent = sortedColors[1] || sortedColors[0];
    
    // Convert RGB to HSL for better color manipulation
    const dominantHsl = rgbToHsl(dominant[0], dominant[1], dominant[2]);
    const accentHsl = rgbToHsl(accent[0], accent[1], accent[2]);
    
    // Generate dark theme palette
    return {
      dominant: `hsl(${dominantHsl.h}, ${dominantHsl.s}%, ${Math.min(dominantHsl.l, 60)}%)`,
      accent: `hsl(${accentHsl.h}, ${accentHsl.s}%, ${Math.min(accentHsl.l + 10, 70)}%)`,
      background: `hsl(${dominantHsl.h}, ${Math.max(dominantHsl.s - 20, 10)}%, ${Math.max(dominantHsl.l - 40, 8)}%)`,
      text: dominantHsl.l > 50 ? '#ffffff' : '#f5f5f5',
      muted: `hsl(${dominantHsl.h}, ${dominantHsl.s}%, ${Math.max(dominantHsl.l - 20, 30)}%)`,
    };
  } catch (error) {
    // Silently fail and return null - will use default palette
    console.warn('Error extracting colors from image, using default palette:', error);
    return null;
  }
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Fallback: Extract colors using Cloudinary API
 */
export async function extractColorsFromCloudinary(
  imageUrl: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<ColorPalette | null> {
  try {
    // Cloudinary color extraction endpoint
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(
      `${cloudinaryUrl}?url=${encodeURIComponent(imageUrl)}&colors=true`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const colors = data.colors;

    if (!colors || colors.length === 0) {
      return null;
    }

    const dominant = colors[0];
    const accent = colors[1] || colors[0];

    // Convert hex to HSL
    const dominantHsl = hexToHsl(dominant);
    const accentHsl = hexToHsl(accent);

    return {
      dominant: `hsl(${dominantHsl.h}, ${dominantHsl.s}%, ${Math.min(dominantHsl.l, 60)}%)`,
      accent: `hsl(${accentHsl.h}, ${accentHsl.s}%, ${Math.min(accentHsl.l + 10, 70)}%)`,
      background: `hsl(${dominantHsl.h}, ${Math.max(dominantHsl.s - 20, 10)}%, ${Math.max(dominantHsl.l - 40, 8)}%)`,
      text: dominantHsl.l > 50 ? '#ffffff' : '#f5f5f5',
      muted: `hsl(${dominantHsl.h}, ${dominantHsl.s}%, ${Math.max(dominantHsl.l - 20, 30)}%)`,
    };
  } catch (error) {
    console.error('Error extracting colors from Cloudinary:', error);
    return null;
  }
}

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgbToHsl(r * 255, g * 255, b * 255);
}

/**
 * Get default dark theme palette as fallback
 */
export function getDefaultPalette(): ColorPalette {
  return {
    dominant: 'hsl(24, 95%, 53%)', // Orange brand color
    accent: 'hsl(24, 95%, 60%)',
    background: 'hsl(0, 0%, 8%)',
    text: '#ffffff',
    muted: 'hsl(0, 0%, 30%)',
  };
}

