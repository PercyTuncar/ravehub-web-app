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

  // Brand colors
  const BRAND_ORANGE = 'hsl(24, 95%, 53%)';
  const BRAND_CYAN = 'hsl(200, 100%, 50%)';
  const DEFAULT_ACCENT = 'hsl(24, 95%, 60%)';

  const calculateColors = (domColor: string, accColor: string) => ({
    dominantRgba: convertColorToRgba(domColor, 0.08),
    accentRgba: convertColorToRgba(accColor, 0.07),
    dominantRgbaLight: convertColorToRgba(domColor, 0.05),
  });

  // Calculate target colors based on current palette
  const getTargetColors = () => {
    const dominantColor = colorPalette?.dominant || BRAND_ORANGE;
    const paletteAccent = colorPalette?.accent || DEFAULT_ACCENT;

    const isUsingDefaultPalette = paletteAccent === DEFAULT_ACCENT ||
      paletteAccent === BRAND_ORANGE ||
      !colorPalette?.accent;
    const gradientAccentColor = isUsingDefaultPalette ? BRAND_CYAN : paletteAccent;

    return calculateColors(dominantColor, gradientAccentColor);
  };

  const [activeColors, setActiveColors] = useState(calculateColors(BRAND_ORANGE, BRAND_CYAN));
  const [nextColors, setNextColors] = useState<ReturnType<typeof calculateColors> | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const target = getTargetColors();

    // Deep compare to avoid unnecessary updates if colors are effectively same
    // We compare against `nextColors` if it exists (latest target), otherwise `activeColors`
    const currentTarget = nextColors || activeColors;

    if (JSON.stringify(target) !== JSON.stringify(currentTarget)) {
      // New color detected!
      setNextColors(target);

      // Clear existing timer if we were already waiting to commit a color
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set timer to commit this new color as the "Active/Base" color after fade completes
      transitionTimeoutRef.current = setTimeout(() => {
        setActiveColors(target);
        setNextColors(null);
        transitionTimeoutRef.current = null;
      }, 1200); // 1.2s to match CSS duration
    }
  }, [colorPalette]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 bg-[#141618]">
      {/* Active Layer (Base) - Always visible, sits behind */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 transition-colors duration-[2000ms]" style={{ background: `radial-gradient(circle at 15% 18%, ${activeColors.dominantRgba}, transparent 52%)` }} />
        <div className="absolute inset-0 transition-colors duration-[2000ms]" style={{ background: `radial-gradient(circle at 80% 25%, ${activeColors.accentRgba}, transparent 48%)` }} />
        <div className="absolute inset-0 transition-colors duration-[2000ms]" style={{ background: `radial-gradient(circle at 60% 82%, ${activeColors.dominantRgbaLight}, transparent 55%)` }} />
      </div>

      {/* Next Layer (Overlay) - Fades In when `nextColors` is present */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{ opacity: nextColors ? 1 : 0 }}
      >
        {nextColors && (
          <>
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 15% 18%, ${nextColors.dominantRgba}, transparent 52%)` }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 80% 25%, ${nextColors.accentRgba}, transparent 48%)` }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 60% 82%, ${nextColors.dominantRgbaLight}, transparent 55%)` }} />
          </>
        )}
      </div>

      {/* Top fade gradient for navbar blend */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#141618] via-[#141618]/95 to-transparent" />
    </div>
  );
}
