'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ColorPalette, getDefaultPalette } from '@/lib/utils/color-extraction';

interface EventColorContextType {
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
}

const EventColorContext = createContext<EventColorContextType | undefined>(undefined);

export function EventColorProvider({ children }: { children: ReactNode }) {
  const [colorPalette, setColorPalette] = useState<ColorPalette>(getDefaultPalette());

  return (
    <EventColorContext.Provider value={{ colorPalette, setColorPalette }}>
      {children}
    </EventColorContext.Provider>
  );
}

export function useEventColors() {
  const context = useContext(EventColorContext);
  if (!context) {
    return { colorPalette: getDefaultPalette(), setColorPalette: () => {} };
  }
  return context;
}

