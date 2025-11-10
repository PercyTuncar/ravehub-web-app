'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  ColorPalette,
  getDefaultPalette,
  extractColorsFromImageEnhanced,
  applyColorPaletteToDocument,
  generateCSSCustomProperties
} from '@/lib/utils/enhanced-color-extraction';

interface EventColorContextType {
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  isExtracting: boolean;
  extractionError: string | null;
}

const EventColorContext = createContext<EventColorContextType | undefined>(undefined);

export function EventColorProvider({ children }: { children: ReactNode }) {
  const [colorPalette, setColorPalette] = useState<ColorPalette>(getDefaultPalette());
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Apply palette to document when it changes
  useEffect(() => {
    applyColorPaletteToDocument(colorPalette);
  }, [colorPalette]);

  const contextValue: EventColorContextType = {
    colorPalette,
    setColorPalette,
    isExtracting,
    extractionError,
  };

  return (
    <EventColorContext.Provider value={contextValue}>
      {children}
    </EventColorContext.Provider>
  );
}

export function useEventColors() {
  const context = useContext(EventColorContext);
  if (!context) {
    return {
      colorPalette: getDefaultPalette(),
      setColorPalette: () => {},
      isExtracting: false,
      extractionError: null
    };
  }
  return context;
}

// Enhanced color extraction hook
export function useEnhancedColorExtraction(imageUrl: string) {
  const context = useEventColors();
  const { setColorPalette } = context;
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const extractColors = async () => {
    if (!imageUrl) {
      setColorPalette(getDefaultPalette());
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const palette = await extractColorsFromImageEnhanced(imageUrl, {
        quality: 'balanced',
        targetContrast: 'AA'
      });
      
      if (palette) {
        setColorPalette(palette);
      } else {
        setColorPalette(getDefaultPalette());
      }
    } catch (error) {
      console.error('Color extraction failed:', error);
      setLocalError(error instanceof Error ? error.message : 'Color extraction failed');
      setColorPalette(getDefaultPalette());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    extractColors();
  }, [imageUrl]);

  return {
    extractColors,
    loading: loading || context.isExtracting,
    error: localError || context.extractionError,
  };
}

