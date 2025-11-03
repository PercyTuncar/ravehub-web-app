import type { Metadata } from 'next'
import { getEventsByCountry } from '@/lib/data-fetching'
import { Event } from '@/lib/types'
import JsonLd from '@/components/seo/JsonLd'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, ArrowRight, Zap, Crown, Star, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Eventos de Música Electrónica en Perú | Ravehub',
  description: 'Descubre todos los eventos de música electrónica en Perú. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más en Lima, Cusco, Arequipa y todo el Perú.',
  keywords: ['eventos Perú', 'música electrónica Perú', 'festivales EDM Perú', 'conciertos Perú', 'techno Perú', 'house Perú', 'trance Perú', 'entradas Perú', 'Lima', 'Cusco', 'Arequipa'],
  alternates: { canonical: 'https://www.ravehublatam.com/pe/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.ravehublatam.com/pe/',
    title: 'Eventos de Música Electrónica en Perú | Ravehub',
    description: 'Compra entradas oficiales para los mejores eventos de música electrónica en Perú.',
    siteName: 'Ravehub',
    images: [
      {
        url: 'https://www.ravehublatam.com/static/og-image-peru.jpg',
        width: 1200,
        height: 630,
        alt: 'Eventos de música electrónica en Perú - Ravehub'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventos de Música Electrónica en Perú | Ravehub',
    description: 'Compra entradas oficiales para los mejores eventos de música electrónica en Perú.',
    images: ['https://www.ravehublatam.com/static/og-image-peru.jpg']
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.ravehublatam.com/pe/#webpage",
      "url": "https://www.ravehublatam.com/pe/",
      "name": "Eventos de Música Electrónica en Perú | Ravehub",
      "description": "Descubre todos los eventos de música electrónica en Perú. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más.",
      "isPartOf": {
        "@id": "https://www.ravehublatam.com/#website"
      },
      "about": {
        "@type": "Place",
        "name": "Perú",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "PE"
        }
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": "Eventos de música electrónica en Perú",
        "description": "Lista completa de eventos de música electrónica disponibles en Perú"
      },
      "inLanguage": "es-419",
      "datePublished": "2023-01-15T00:00:00+00:00",
      "dateModified": "2025-10-26T01:30:00+00:00"
    }
  ]
}

// SVG ICONOS CULTURALES MINIMALISTAS
const PeruLlamaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M25 30 Q30 25 35 30 L40 35 Q45 40 40 45 L35 50 Q30 55 35 60 L40 65 Q45 70 40 75 L35 80 Q30 85 25 80 L20 75 Q15 70 20 65 L25 60 Q30 55 25 50 L20 45 Q15 40 20 35 L25 30 Z"/>
    <circle cx="30" cy="35" r="2"/>
  </svg>
)

const ChakanaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M30 20 L50 20 L50 30 L70 30 L70 50 L60 50 L60 70 L50 70 L50 80 L30 80 L30 70 L20 70 L20 50 L30 50 L30 30 Z"/>
    <path d="M50 20 L50 80" strokeWidth="1"/>
    <path d="M20 50 L80 50" strokeWidth="1"/>
  </svg>
)

async function getPeruEvents(): Promise<Event[]> {
  try {
    const { events } = await getEventsByCountry('PE')
    return events
  } catch (error) {
    console.error('Error loading Peru events:', error)
    return []
  }
}

export default async function PeruPage() {
  const events = await getPeruEvents()

  return (
    <main className="min-h-screen bg-black">
      <JsonLd id="peru-page-jsonld" data={jsonLd} />

      {/* ======================================== */}
      {/* HERO SECTION REDISEÑADO - DISTRIBUCIÓN PERFECTA */}
      {/* ======================================== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        
        {/* 🎥 VIDEO DE FONDO PRINCIPAL */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          preload="auto"
        >
          <source src="/videos/peru-hero-bg.mp4" type="video/mp4" />
          <source src="/videos/peru-hero-bg.webm" type="video/webm" />
        </video>

        {/* 🖼️ OVERLAY CINEMATOGRÁFICO OPTIMIZADO */}
        <div className="absolute inset-0 z-10">
          {/* Gradiente principal para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/85" />
          
          {/* Overlay rojo sutil para ambiente peruano */}
          <div className="absolute inset-0 bg-gradient-to-tr from-red-900/25 via-transparent to-black/35" />
          
          {/* Vignette effect para efecto cinematográfico */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60" />
        </div>

        {/* ======================================== */}
        {/* CONTENIDO REDISEÑADO CON NUEVA DISTRIBUCIÓN */}
        {/* ======================================== */}
        <div className="relative z-20 w-full h-full flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            
            {/* ======================================== */}
            {/* LAYOUT PRINCIPAL - DISTRIBUCIÓN MODERNA */}
            {/* ======================================== */}
            <div className="h-full grid grid-rows-4 gap-4 py-12 md:py-16">
              
              {/* ======================================== */}
              {/* Fila 1: Badge Cultural - Top Center */}
              {/* ======================================== */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-1">
                <div className="inline-flex items-center space-x-3 bg-black/50 backdrop-blur-lg rounded-full px-6 py-3 border border-red-400/30 shadow-xl">
                  <Crown className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">Perú • Tierra de los Incas</span>
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* ======================================== */}
              {/* Fila 2: Título Principal - Center */}
              {/* ======================================== */}
              <div className="row-span-2 flex items-center justify-center animate-fade-in-delay-2">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                    <span className="block text-white/90 mb-3">Eventos en</span>
                    <span className="block relative">
                      <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent animate-shimmer">
                        Perú 🦙
                      </span>
                     </span>
                  </h1>
                </div>
              </div>

              {/* ======================================== */}
              {/* Fila 3: Descripción - Center */}
              {/* ======================================== */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-3">
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed font-light">
                   Conectando cada rincón del país a través de la música electrónica.  
                    Desde <span className="text-red-400 font-medium">Tumbes a Tacna,</span> ningún evento de calidad  
                    <span className="text-red-400 font-medium"> se nos escapa.</span>
                  </p>
                </div>
              </div>

              {/* ======================================== */}
              {/* Fila 4: Botones CTA - Bottom */}
              {/* ======================================== */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-4">
                <div className="space-y-6">
                  
                  {/* Botones CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    
                    {/* Botón Principal */}
                    <Link href="/eventos" className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-400 group-hover:from-red-500 group-hover:via-red-400 group-hover:to-red-300 transition-all duration-700" />
                      <div className="relative px-8 sm:px-10 py-3 sm:py-4 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center gap-3 backdrop-blur-sm border border-white/20 shadow-2xl">
                        <PeruLlamaIcon className="w-5 h-5" />
                        <span>Explorar Eventos Sagrados</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Link>
                    
                    {/* Botón Secundario */}
                    <Link href="#eventos" className="group border-2 border-white/40 hover:border-white/60 text-white hover:bg-white/10 font-bold text-base sm:text-lg py-3 sm:py-4 px-8 sm:px-10 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm shadow-xl">
                      <ChakanaIcon className="w-5 h-5" />
                      <span>Ver Destacados</span>
                    </Link>
                  </div>

                  {/* Indicador de Scroll */}
                  <div className="animate-fade-in-delay-5">
                    <div className="flex flex-col items-center gap-2 text-white/60">
                      <span className="text-xs font-medium tracking-widest">DESCUBRIR MÁS</span>
                      <div className="w-px h-6 bg-white/40 flex items-end">
                        <div className="w-px h-2.5 bg-white rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================== */}
      {/* DEGRADADO PERFECTO SIN TAPAR ELEMENTOS */}
      {/* ======================================== */}
      <div className="relative z-30 -mt-20">
        <div className="h-20 bg-gradient-to-b from-transparent to-black" />
        <div className="bg-black">
          
          {/* ======================================== */}
          {/* STATS SECTION MEJORADA */}
          {/* ======================================== */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="flex justify-center mb-6">
                  <ChakanaIcon className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Energía Ancestral Electrónica
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  La fuerza de la música electrónica peruana que conecta cielo y tierra
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-3xl p-8 border border-red-500/20 hover:border-red-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-red-400 mb-3 flex items-center justify-center gap-3">
                      {events.length}
                      <PeruLlamaIcon className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Eventos Activos</div>
                    <div className="text-sm text-gray-400 mt-2">Listos para despertar</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-3xl p-8 border border-red-500/20 hover:border-red-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-red-400 mb-3 flex items-center justify-center gap-3">
                      6
                      <MapPin className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Ciudades Sagradas</div>
                    <div className="text-sm text-gray-400 mt-2">Desde Lima hasta Cusco</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-3xl p-8 border border-red-500/20 hover:border-red-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-red-400 mb-3 flex items-center justify-center gap-3">
                      50+
                      <Zap className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">DJ's Andinos</div>
                    <div className="text-sm text-gray-400 mt-2">Guerreros del sonido</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Events Section with Cultural Integration */}
      <section id="eventos" className="py-20 px-4 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <ChakanaIcon className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Próximos Eventos </span>
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Sagrados
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Desde los Andes hasta la costa, cada evento es un ritual moderno 
              donde la tradición peruana se encuentra con el futuro de la música electrónica.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-900/50 rounded-3xl p-12 border border-gray-700/50">
                <ChakanaIcon className="w-24 h-24 text-red-500/50 mx-auto mb-6" />
                <p className="text-2xl text-gray-300 mb-4">Los espíritus están preparando algo especial</p>
                <p className="text-gray-500">Próximamente nuevos eventos sagrados se revelarán...</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 9).map((event, index) => (
                <Card key={event.id} className="group overflow-hidden bg-gray-900/50 border-gray-700/50 hover:border-red-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={event.mainImageUrl || '/placeholder-event.jpg'}
                      alt={event.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-red-500/90 text-white backdrop-blur-sm border-0">
                        {event.eventType === 'festival' ? 'Festival Sagrado' : event.eventType === 'concert' ? 'Ritual Sonoro' : 'Círculo Místico'}
                      </Badge>
                      {event.isHighlighted && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                          <Star className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ChakanaIcon className="w-4 h-4 text-red-400" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-white group-hover:text-red-300 transition-colors line-clamp-2">{event.name}</h3>
                    
                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <span className="font-medium">{format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span>{event.location.city || event.location.venue}, {event.location.region}</span>
                      </div>
                      {event.startTime && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <Clock className="w-4 h-4 text-red-400" />
                          <span>{event.startTime}</span>
                        </div>
                      )}
                    </div>

                    <Link href={`/eventos/${event.slug}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                        <span>Explorar Ritual</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {events.length > 9 && (
            <div className="text-center mt-16">
              <Link href="/eventos">
                <Button variant="outline" size="lg" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all duration-300">
                  <ChakanaIcon className="w-5 h-5 mr-2" />
                  Ver Todos los Eventos Sagrados
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Cities Section with Cultural Design */}
      <section className="py-20 px-4 bg-gradient-to-b from-black via-red-950/10 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <PeruLlamaIcon className="w-16 h-16 text-red-500" />
          </div>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-white">Territorios </span>
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Sagrados
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Explora la música electrónica en las ciudades más místicas del Perú
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Lima', count: events.filter(e => e.location.city?.toLowerCase().includes('lima')).length, icon: '🏛️' },
              { name: 'Cusco', count: events.filter(e => e.location.city?.toLowerCase().includes('cusco')).length, icon: '🏔️' },
              { name: 'Arequipa', count: events.filter(e => e.location.city?.toLowerCase().includes('arequipa')).length, icon: '🌋' },
              { name: 'Trujillo', count: events.filter(e => e.location.city?.toLowerCase().includes('trujillo')).length, icon: '🏖️' },
              { name: 'Piura', count: events.filter(e => e.location.city?.toLowerCase().includes('piura')).length, icon: '🏜️' },
              { name: 'Chiclayo', count: events.filter(e => e.location.city?.toLowerCase().includes('chiclayo')).length, icon: '🌾' }
            ].map((city) => (
              <Link
                key={city.name}
                href={`/eventos?region=${city.name.toLowerCase()}`}
                className="group relative overflow-hidden"
              >
                <div className="bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700/50 hover:border-red-500/50 rounded-2xl p-6 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-red-500/20">
                  <div className="text-3xl mb-3">{city.icon}</div>
                  <h3 className="font-bold text-white text-lg mb-1 group-hover:text-red-300 transition-colors">{city.name}</h3>
                  <p className="text-sm text-gray-400">{city.count} eventos</p>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChakanaIcon className="w-4 h-4 text-red-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Newsletter with Cultural Elements */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ChakanaIcon className="absolute top-10 left-10 w-32 h-32 text-white" />
          <PeruLlamaIcon className="absolute bottom-10 right-10 w-24 h-24 text-white" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 rounded-full p-4 backdrop-blur-sm">
              <ChakanaIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Únete al Círculo Místico
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Recibe las energías más poderosas: preventas exclusivas, lineups sagrados 
            y secretos ancestrales de la música electrónica peruana.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto" aria-label="Suscripción al newsletter de Perú">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Tu email espiritual"
                className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-red-200 focus:outline-none focus:border-white/40 transition-all duration-300"
                aria-label="Dirección de email"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-white text-red-900 hover:bg-red-50 font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>Despertar Energías</span>
              <Zap className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-red-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Comunicación ancestral segura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Sin spam, solo energía pura</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Desuscribete cuando quieras</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}