// Este loading solo se muestra durante navegaciones client-side
// Con ISR, la página se carga instantáneamente desde el CDN
// Por lo tanto, este componente rara vez se verá

export default function Loading() {
  // No mostrar nada - la carga es instantánea con ISR
  return null;
}
