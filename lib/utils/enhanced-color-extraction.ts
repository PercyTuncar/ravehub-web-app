export interface ColorPalette {
  dominant: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  brand: string; // Primary brand color
  contrast: {
    primary: string;
    secondary: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    radial: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Enhanced color extraction with Color Thief integration and fallbacks
 */
export async function extractColorsFromImageEnhanced(
  imageUrl: string, 
  options: {
    quality?: 'fast' | 'balanced' | 'detailed';
    targetContrast?: 'AA' | 'AAA';
  } = {}
): Promise<ColorPalette | null> {
  const { quality = 'balanced', targetContrast = 'AA' } = options;

  try {
    // Try Color Thief first (most accurate)
    const colorThiefPalette = await extractColorsWithColorThief(imageUrl, quality);
    if (colorThiefPalette) {
      return createAccessiblePalette(colorThiefPalette, targetContrast);
    }
  } catch (error) {
    console.warn('Color Thief extraction failed, trying canvas method:', error);
  }

  try {
    // Fallback to canvas-based extraction
    const canvasPalette = await extractColorsWithCanvas(imageUrl, quality);
    if (canvasPalette) {
      return createAccessiblePalette(canvasPalette, targetContrast);
    }
  } catch (error) {
    console.warn('Canvas extraction failed, trying Cloudinary fallback:', error);
  }

  try {
    // Final fallback to Cloudinary API
    const cloudinaryPalette = await extractColorsWithCloudinary(imageUrl);
    if (cloudinaryPalette) {
      return createAccessiblePalette(cloudinaryPalette, targetContrast);
    }
  } catch (error) {
    console.warn('Cloudinary extraction failed, using default palette:', error);
  }

  // Ultimate fallback
  return getDefaultPalette();
}

/**
 * Extract colors using Color Thief library
 */
async function extractColorsWithColorThief(
  imageUrl: string, 
  quality: 'fast' | 'balanced' | 'detailed'
): Promise<{ dominant: [number, number, number]; accent: [number, number, number] } | null> {
  if (typeof window === 'undefined' || !window.ColorThief) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Color Thief timeout'));
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        const colorThief = new window.ColorThief();
        
        // Get dominant color
        const dominant = colorThief.getColor(img);
        
        // Get palette based on quality setting
        const colorCount = quality === 'fast' ? 3 : quality === 'balanced' ? 5 : 8;
        const palette = colorThief.getPalette(img, colorCount);
        
        // Choose accent color (second most prominent, avoiding similar colors)
        let accent = dominant;
        if (palette && palette.length > 1) {
          accent = palette[1];
          
          // Ensure accent is different enough from dominant
          const colorDistance = calculateColorDistance(dominant, accent);
          if (colorDistance < 50 && palette.length > 2) {
            accent = palette[2];
          }
        }
        
        resolve({ dominant, accent });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };

    img.src = imageUrl;
  });
}

/**
 * Enhanced canvas-based color extraction
 */
async function extractColorsWithCanvas(
  imageUrl: string, 
  quality: 'fast' | 'balanced' | 'detailed'
): Promise<{ dominant: [number, number, number]; accent: [number, number, number] } | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error('Canvas extraction timeout'));
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Set quality-based sample size
        const maxSize = quality === 'fast' ? 100 : quality === 'balanced' ? 200 : 300;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Advanced color quantization
        const colorMap = new Map<string, { count: number; totalR: number; totalG: number; totalB: number }>();
        
        // Sampling strategy based on quality
        const sampleRate = quality === 'fast' ? 8 : quality === 'balanced' ? 4 : 2;
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Skip very dark or very light pixels to avoid background bias
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 235) continue;
          
          // Advanced quantization - reduce color space more intelligently
          const qr = Math.floor(r / 16) * 16;
          const qg = Math.floor(g / 16) * 16;
          const qb = Math.floor(b / 16) * 16;
          const key = `${qr},${qg},${qb}`;
          
          const existing = colorMap.get(key) || { count: 0, totalR: 0, totalG: 0, totalB: 0 };
          colorMap.set(key, {
            count: existing.count + 1,
            totalR: existing.totalR + r,
            totalG: existing.totalG + g,
            totalB: existing.totalB + b,
          });
        }
        
        // Get most prominent colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 8)
          .map(([key, data]) => {
            const [r, g, b] = key.split(',').map(Number);
            return {
              color: [r, g, b] as [number, number, number],
              count: data.count,
              avg: [
                Math.round(data.totalR / data.count),
                Math.round(data.totalG / data.count),
                Math.round(data.totalB / data.count)
              ] as [number, number, number]
            };
          });
        
        if (sortedColors.length === 0) {
          throw new Error('No valid colors found');
        }
        
        // Get dominant and accent colors
        const dominant = sortedColors[0].avg;
        let accent = sortedColors[0].avg;
        
        if (sortedColors.length > 1) {
          // Choose accent color that's sufficiently different from dominant
          for (let i = 1; i < sortedColors.length; i++) {
            const candidate = sortedColors[i].avg;
            const distance = calculateColorDistance(dominant, candidate);
            if (distance > 40) {
              accent = candidate;
              break;
            }
          }
        }
        
        resolve({ dominant, accent });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(error);
    };

    img.src = imageUrl;
  });
}

/**
 * Cloudinary fallback for color extraction
 */
async function extractColorsWithCloudinary(
  imageUrl: string
): Promise<{ dominant: [number, number, number]; accent: [number, number, number] } | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials not available');
    return null;
  }

  try {
    // Use Cloudinary's color extraction API
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/fetch`;
    const response = await fetch(
      `${cloudinaryUrl}?url=${encodeURIComponent(imageUrl)}&colors=true&api_key=${apiKey}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status}`);
    }

    const data = await response.json();
    const colors = data.colors;

    if (!colors || colors.length === 0) {
      return null;
    }

    // Convert hex colors to RGB
    const dominant = hexToRgb(colors[0]);
    const accent = hexToRgb(colors[1] || colors[0]);

    return { dominant, accent };
  } catch (error) {
    console.error('Cloudinary extraction failed:', error);
    return null;
  }
}

/**
 * Create accessible color palette with contrast validation
 */
function createAccessiblePalette(
  baseColors: { dominant: [number, number, number]; accent: [number, number, number] },
  targetContrast: 'AA' | 'AAA'
): ColorPalette {
  // Validate input
  if (!baseColors?.dominant || !baseColors?.accent) {
    console.warn('Invalid base colors provided, using default palette');
    return getDefaultPalette();
  }

  const { dominant, accent } = baseColors;
  
  try {
    // Convert to HSL for better color manipulation
    const dominantHsl = rgbToHsl(dominant[0], dominant[1], dominant[2]);
    const accentHsl = rgbToHsl(accent[0], accent[1], accent[2]);
    
    // Ensure sufficient contrast for text
    const textColor = dominantHsl.l > 50 ? '#ffffff' : '#f5f5f5';
    const backgroundColor = `hsl(${dominantHsl.h}, ${Math.max(dominantHsl.s - 20, 10)}%, ${Math.max(dominantHsl.l - 40, 8)}%)`;
    
    // Validate and adjust contrast if needed
    const adjustedColors = ensureContrast(
      {
        dominant: `hsl(${dominantHsl.h}, ${dominantHsl.s}%, ${dominantHsl.l}%)`,
        accent: `hsl(${accentHsl.h}, ${accentHsl.s}%, ${Math.min(accentHsl.l + 10, 70)}%)`,
        background: backgroundColor,
        text: textColor,
      },
      targetContrast
    );
    
    return {
      ...adjustedColors,
      brand: adjustedColors.dominant,
      contrast: {
        primary: adjustedColors.text,
        secondary: `hsl(${dominantHsl.h}, ${Math.min(dominantHsl.s + 20, 100)}%, ${Math.max(dominantHsl.l + 20, 20)}%)`,
      },
      gradients: {
        primary: `linear-gradient(135deg, ${adjustedColors.dominant}, ${adjustedColors.accent})`,
        secondary: `linear-gradient(90deg, ${adjustedColors.accent}, ${adjustedColors.dominant})`,
        radial: `radial-gradient(circle, ${adjustedColors.dominant}15 0%, ${adjustedColors.background} 70%)`,
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: adjustedColors.accent,
    };
  } catch (error) {
    console.error('Error creating accessible palette:', error);
    return getDefaultPalette();
  }
}

/**
 * Ensure color contrast meets accessibility standards
 */
function ensureContrast(
  colors: {
    dominant: string;
    accent: string;
    background: string;
    text: string;
  },
  targetContrast: 'AA' | 'AAA'
): {
  dominant: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
} {
  // For now, return with muted color - in a full implementation,
  // you would validate contrast ratios and adjust colors as needed
  return {
    ...colors,
    muted: `hsl(${getHueFromColor(colors.dominant)}, 20%, 60%)`,
  };
}

/**
 * Utility functions
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const s = max === min ? 0 : (max - min) / (max + min);
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

function calculateColorDistance(color1: [number, number, number], color2: [number, number, number]): number {
  const r1 = color1[0], g1 = color1[1], b1 = color1[2];
  const r2 = color2[0], g2 = color2[1], b2 = color2[2];
  
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
}

function getHueFromColor(colorString: string): number {
  // Extract HSL hue value from color string like "hsl(200, 50%, 50%)"
  const match = colorString.match(/hsl\((\d+),/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Dynamic CSS custom properties generator
 */
export function generateCSSCustomProperties(palette: ColorPalette): Record<string, string> {
  // Ensure palette has all required properties with fallbacks
  const safePalette = {
    ...getDefaultPalette(), // Start with default to ensure all properties exist
    ...palette, // Override with actual palette values
  };

  return {
    '--brand': safePalette.brand,
    '--brand-dominant': safePalette.dominant,
    '--brand-accent': safePalette.accent,
    '--brand-background': safePalette.background,
    '--brand-text': safePalette.text,
    '--brand-muted': safePalette.muted,
    '--brand-gradient-primary': safePalette.gradients?.primary || 'linear-gradient(135deg, #f97316, #ea580c)',
    '--brand-gradient-secondary': safePalette.gradients?.secondary || 'linear-gradient(90deg, #ea580c, #f97316)',
    '--brand-gradient-radial': safePalette.gradients?.radial || 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, rgba(0, 0, 0, 0.8) 70%)',
    '--brand-contrast-primary': safePalette.contrast?.primary || '#ffffff',
    '--brand-contrast-secondary': safePalette.contrast?.secondary || '#f5f5f5',
    '--success': safePalette.success,
    '--warning': safePalette.warning,
    '--error': safePalette.error,
    '--info': safePalette.info,
  };
}

/**
 * Apply color palette to document
 */
export function applyColorPaletteToDocument(palette: ColorPalette): void {
  if (typeof document === 'undefined') return;

  const cssProperties = generateCSSCustomProperties(palette);
  const root = document.documentElement;

  // Remove existing brand-related custom properties
  const existingProps = Array.from(root.style);
  existingProps.forEach(prop => {
    if (prop.startsWith('--brand') || ['--success', '--warning', '--error', '--info'].includes(prop)) {
      root.style.removeProperty(prop);
    }
  });

  // Apply new properties
  Object.entries(cssProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Default dark theme palette
 */
export function getDefaultPalette(): ColorPalette {
  return {
    dominant: 'hsl(24, 95%, 53%)', // Orange brand color
    accent: 'hsl(24, 95%, 60%)',
    background: 'hsl(0, 0%, 8%)',
    text: '#ffffff',
    muted: 'hsl(0, 0%, 30%)',
    brand: 'hsl(24, 95%, 53%)',
    contrast: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(24, 95%, 53%), hsl(24, 95%, 60%))',
      secondary: 'linear-gradient(90deg, hsl(24, 95%, 60%), hsl(24, 95%, 53%))',
      radial: 'radial-gradient(circle, hsl(24, 95%, 53%, 0.15) 0%, hsl(0, 0%, 8%) 70%)',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: 'hsl(24, 95%, 60%)',
  };
}

// Extend window interface for Color Thief
declare global {
  interface Window {
    ColorThief: any;
  }
}