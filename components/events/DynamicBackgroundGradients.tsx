'use client';

import { useEventColors } from './EventColorContext';
import { hslToRgba } from '@/lib/utils/enhanced-color-extraction';
import Color from 'color';
import { useEffect, useState, useRef } from 'react';

export function DynamicBackgroundGradients() {
  const { colorPalette } = useEventColors();
  const [gradientColors, setGradientColors] = useState({
    dominantRgba: 'rgba(251, 169, 5, 0.08)',
    accentRgba: 'rgba(0, 203, 255, 0.07)',
    dominantRgbaLight: 'rgba(251, 169, 5, 0.05)',
  });
  const [opacity, setOpacity] = useState(1); // Start with opacity 1 to show default colors
  const previousColorsRef = useRef(gradientColors);
  const isFirstLoadRef = useRef(true);
  
  // Get colors with fallbacks
  const dominantColor = colorPalette?.dominant || 'hsl(24, 95%, 53%)';
  const accentColor = colorPalette?.accent || 'hsl(200, 100%, 50%)';
  
  // Update gradient colors smoothly when palette changes
  useEffect(() => {
    let dominantRgba = 'rgba(251, 169, 5, 0.08)';
    let accentRgba = 'rgba(0, 203, 255, 0.07)';
    let dominantRgbaLight = 'rgba(251, 169, 5, 0.05)';
    
    try {
      // Use Color library to convert and ensure proper format
      const dominantColorObj = Color(dominantColor);
      const accentColorObj = Color(accentColor);
      
      dominantRgba = dominantColorObj.alpha(0.08).rgb().string();
      accentRgba = accentColorObj.alpha(0.07).rgb().string();
      dominantRgbaLight = dominantColorObj.alpha(0.05).rgb().string();
    } catch (error) {
      // Fallback to hslToRgba if Color library fails
      try {
        dominantRgba = hslToRgba(dominantColor, 0.08);
        accentRgba = hslToRgba(accentColor, 0.07);
        dominantRgbaLight = hslToRgba(dominantColor, 0.05);
      } catch (e) {
        // Use defaults if all fails
        console.warn('Error converting colors for gradients:', e);
      }
    }
    
    // Check if colors have actually changed
    const newColors = { dominantRgba, accentRgba, dominantRgbaLight };
    const colorsChanged = 
      previousColorsRef.current.dominantRgba !== newColors.dominantRgba ||
      previousColorsRef.current.accentRgba !== newColors.accentRgba ||
      previousColorsRef.current.dominantRgbaLight !== newColors.dominantRgbaLight;
    
    if (isFirstLoadRef.current) {
      // First load - set colors immediately without transition
      setGradientColors(newColors);
      previousColorsRef.current = newColors;
      isFirstLoadRef.current = false;
      setOpacity(1); // Ensure opacity is 1 for first load
    } else if (colorsChanged) {
      // Colors changed - smooth crossfade transition
      // Update the new layer colors first (while opacity is still 0, so it's invisible)
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
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Second gradient - accent color at top right */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 25%, ${previousColorsRef.current.accentRgba}, transparent 48%)`,
            opacity: 1 - opacity,
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Third gradient - lighter dominant at bottom */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 60% 82%, ${previousColorsRef.current.dominantRgbaLight}, transparent 55%)`,
            opacity: 1 - opacity,
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
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
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Second gradient - accent color at top right */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 80% 25%, ${gradientColors.accentRgba}, transparent 48%)`,
            opacity: opacity,
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Third gradient - lighter dominant at bottom */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 60% 82%, ${gradientColors.dominantRgbaLight}, transparent 55%)`,
            opacity: opacity,
            transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      
      {/* Top fade gradient */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
    </div>
  );
}

