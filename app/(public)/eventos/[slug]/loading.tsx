// Este loading solo se muestra durante navegaciones client-side
// Con ISR (revalidate = 600), la página se carga instantáneamente desde el CDN
// Por lo tanto, este componente rara vez se verá

export default function Loading() {
  // No mostrar skeleton - la carga es instantánea con ISR
  // El skeleton causaría un "flash" visual innecesario
  return null;
}
