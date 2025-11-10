'use client';

import { useEventColors } from './EventColorContext';
import { hslToRgba } from '@/lib/utils/enhanced-color-extraction';
import Color from 'color';
import { useEffect, useState, useRef } from 'react';

// Helper function to convert color to rgba
function convertColorToRgba(color: string, alpha: number): string {
  try {
    const colorObj = Color(color);
    return colorObj.alpha(alpha).rgb().string();
  } catch (error) {
    try {
      return hslToRgba(color, alpha);
    } catch (e) {
      // Fallback defaults
      if (alpha === 0.08) return 'rgba(251, 169, 5, 0.08)';
      if (alpha === 0.07) return 'rgba(0, 203, 255, 0.07)';
      if (alpha === 0.05) return 'rgba(251, 169, 5, 0.05)';
      return 'rgba(251, 169, 5, 0.08)';
    }
  }
}

export function DynamicBackgroundGradients() {
  const { colorPalette } = useEventColors();
  
  // Get colors with fallbacks (matching getDefaultPalette)
  const dominantColor = colorPalette?.dominant || 'hsl(24, 95%, 53%)';
  const accentColor = colorPalette?.accent || 'hsl(200, 100%, 50%)';
  
  // Calculate colors from context for current render
  const calculateColors = (domColor: string, accColor: string) => ({
    dominantRgba: convertColorToRgba(domColor, 0.08),
    accentRgba: convertColorToRgba(accColor, 0.07),
    dominantRgbaLight: convertColorToRgba(domColor, 0.05),
  });
  
  // Initialize state with colors from context (ensures consistency from first render)
  const initialColors = calculateColors(dominantColor, accentColor);
  const [gradientColors, setGradientColors] = useState(initialColors);
  const [opacity, setOpacity] = useState(1); // Start with opacity 1 to show default colors
  const previousColorsRef = useRef(initialColors);
  const hasInitializedRef = useRef(false);
  
  // Update gradient colors smoothly when palette changes
  useEffect(() => {
    const newColors = calculateColors(dominantColor, accentColor);
    
    // On first render, initialize refs silently
    if (!hasInitializedRef.current) {
      previousColorsRef.current = newColors;
      hasInitializedRef.current = true;
      return; // Don't trigger any updates on first render
    }
    
    // Check if colors have actually changed
    const colorsChanged = 
      previousColorsRef.current.dominantRgba !== newColors.dominantRgba ||
      previousColorsRef.current.accentRgba !== newColors.accentRgba ||
      previousColorsRef.current.dominantRgbaLight !== newColors.dominantRgbaLight;
    
    if (colorsChanged) {
      // Colors changed - smooth crossfade transition
      // Update the new layer colors first (while opacity is still 1, so old layer is visible)
      setGradientColors(newColors);
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Start crossfade: fade out old layer, fade in new layer
        setOpacity(0);
        
        // After transition starts, update previous colors reference
        requestAnimationFrame(() => {
          previousColorsRef.current = newColors;
          // Fade in new layer
          setOpacity(1);
        });
      });
    }
  }, [dominantColor, accentColor]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Base layer with default colors - always visible */}
      <div className="absolute inset-0">
        {/* First gradient - dominant color at top left */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 15% 18%, ${previousColorsRef.current.dominantRgba}, transparent 52%)`,
            opacity: 1 - opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Second gradient - accent color at top right */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 25%, ${previousColorsRef.current.accentRgba}, transparent 48%)`,
            opacity: 1 - opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Third gradient - lighter dominant at bottom */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 60% 82%, ${previousColorsRef.current.dominantRgbaLight}, transparent 55%)`,
            opacity: 1 - opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      
      {/* New layer with extracted colors - fades in */}
      <div className="absolute inset-0">
        {/* First gradient - dominant color at top left */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 15% 18%, ${gradientColors.dominantRgba}, transparent 52%)`,
            opacity: opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Second gradient - accent color at top right */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 25%, ${gradientColors.accentRgba}, transparent 48%)`,
            opacity: opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Third gradient - lighter dominant at bottom */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 60% 82%, ${gradientColors.dominantRgbaLight}, transparent 55%)`,
            opacity: opacity,
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      
      {/* Top fade gradient */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
    </div>
  );
}

