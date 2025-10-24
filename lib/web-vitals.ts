import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry); // INP replaces FID in newer versions
  }
}

// Función para enviar métricas a Google Analytics 4
export function sendToGoogleAnalytics({ name, delta, value, id }: any) {
  // Verificar si gtag está disponible
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      custom_map: { metric_value: value },
      non_interaction: true,
    });
  }

  // También podemos enviar a otros servicios de monitoreo
  console.log('Web Vital:', { name, delta, value, id });
}