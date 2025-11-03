import type { Metadata } from 'next'
import { getEventsByCountry } from '@/lib/data-fetching'
import { Event } from '@/lib/types'
import JsonLd from '@/components/seo/JsonLd'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, ArrowRight, Zap, Crown, Star, Play, Sparkles, Mountain, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Eventos de Música Electrónica en Chile | Ravehub',
  description: 'Descubre todos los eventos de música electrónica en Chile. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más en Santiago, Valparaíso, Viña del Mar y todo Chile.',
  keywords: ['eventos Chile', 'música electrónica Chile', 'festivales EDM Chile', 'conciertos Chile', 'techno Chile', 'house Chile', 'trance Chile', 'entradas Chile', 'Santiago', 'Valparaíso', 'Viña del Mar'],
  alternates: { canonical: 'https://www.ravehublatam.com/cl/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.ravehublatam.com/cl/',
    title: 'Eventos de Música Electrónica en Chile | Ravehub',
    description: 'Compra entradas oficiales para los mejores eventos de música electrónica en Chile.',
    siteName: 'Ravehub',
    images: [
      {
        url: 'https://www.ravehublatam.com/static/og-image-chile.jpg',
        width: 1200,
        height: 630,
        alt: 'Eventos de música electrónica en Chile - Ravehub'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventos de Música Electrónica en Chile | Ravehub',
    description: 'Compra entradas oficiales para los mejores eventos de música electrónica en Chile.',
    images: ['https://www.ravehublatam.com/static/og-image-chile.jpg']
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.ravehublatam.com/cl/#webpage",
      "url": "https://www.ravehublatam.com/cl/",
      "name": "Eventos de Música Electrónica en Chile | Ravehub",
      "description": "Descubre todos los eventos de música electrónica en Chile. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más.",
      "isPartOf": {
        "@id": "https://www.ravehublatam.com/#website"
      },
      "about": {
        "@type": "Place",
        "name": "Chile",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "CL"
        }
      },
      "mainEntity": {
        "@type": "ItemList",
        "name": "Eventos de música electrónica en Chile",
        "description": "Lista completa de eventos de música electrónica disponibles en Chile"
      },
      "inLanguage": "es-419",
      "datePublished": "2023-01-15T00:00:00+00:00",
      "dateModified": "2025-10-26T01:30:00+00:00"
    }
  ]
}

// SVG ICONOS CHILENOS CULTURALES
const ChileAndesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 80 L30 60 L40 70 L50 40 L60 55 L70 45 L80 65 L90 80 Z"/>
    <path d="M20 80 L30 70 L40 75 L50 50 L60 60 L70 55 L80 70 L90 80" strokeWidth="1"/>
    <circle cx="50" cy="35" r="3" fill="currentColor" stroke="none"/>
  </svg>
)

const ChileWindIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 40 Q40 35 60 40 Q80 45 90 40"/>
    <path d="M25 55 Q45 50 65 55 Q85 60 95 55"/>
    <path d="M30 70 Q50 65 70 70 Q90 75 100 70"/>
  </svg>
)

const ChileLagunaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="50" cy="60" rx="35" ry="20"/>
    <path d="M30 55 Q50 50 70 55" strokeWidth="1"/>
    <path d="M35 65 Q50 60 65 65" strokeWidth="1"/>
  </svg>
)

const ChileFlagIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="20" y="30" width="60" height="40" fill="currentColor"/>
    <rect x="20" y="30" width="60" height="10" stroke="white" strokeWidth="2"/>
    <rect x="20" y="30" width="20" height="40" stroke="white" strokeWidth="2"/>
  </svg>
)

async function getChileEvents(): Promise<Event[]> {
  try {
    const { events } = await getEventsByCountry('CL')
    return events
  } catch (error) {
    console.error('Error loading Chile events:', error)
    return []
  }
}

export default async function ChilePage() {
  const events = await getChileEvents()

  return (
    <main className="min-h-screen bg-black">
      <JsonLd id="chile-page-jsonld" data={jsonLd} />

      {/* Hero Section with Chilean Landscape */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        
        {/* Video Background with Chilean Scenery */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          preload="auto"
        >
          <source src="/videos/chile-hero-bg.mp4" type="video/mp4" />
          <source src="/videos/chile-hero-bg.webm" type="video/webm" />
        </video>

        {/* Enhanced Overlay with Chilean Colors */}
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-blue-900/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-800/30 via-transparent to-cyan-900/20" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/70" />
        </div>

        {/* Floating Chilean Elements */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          <div className="absolute top-20 left-10 animate-float">
            <ChileAndesIcon className="w-8 h-8 text-blue-400/40" />
          </div>
          <div className="absolute top-40 right-20 animate-float-delay">
            <ChileWindIcon className="w-6 h-6 text-cyan-300/50" />
          </div>
          <div className="absolute bottom-40 left-20 animate-float">
            <div className="w-4 h-4 bg-blue-500/30 rounded-full animate-pulse" />
          </div>
          <div className="absolute bottom-60 right-10 animate-float-delay">
            <div className="w-3 h-3 bg-cyan-400/40 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="relative z-20 w-full h-full flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            
            <div className="h-full grid grid-rows-4 gap-4 py-12 md:py-16">
              
              {/* Chilean Badge */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-1">
                <div className="inline-flex items-center space-x-3 bg-black/50 backdrop-blur-lg rounded-full px-6 py-3 border border-blue-400/40 shadow-xl animate-glow">
                  <Crown className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Chile • Tierra del Fin del Mundo</span>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Main Title */}
              <div className="row-span-2 flex items-center justify-center animate-fade-in-delay-2">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                    <div className="text-white mb-3">Eventos en</div>
                    <div className="text-blue-500 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold flex items-center gap-3 sm:gap-4 text-center justify-center">
                      <span>Chile</span>
                      <ChileFlagIcon className="w-10 h-8 sm:w-12 sm:h-10 md:w-14 md:h-12" />
                    </div>
                  </h1>
                </div>
              </div>

              {/* Description */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-3">
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed font-light animate-fade-in-up">
                    Donde el <span className="text-blue-400 font-medium">viento patagónico</span> encuentra los beats del futuro.
                    Desde <span className="text-blue-400 font-medium">Arica a Punta Arenas,</span> ningún evento de calidad
                    <span className="text-blue-400 font-medium"> se nos escapa.</span>
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="row-span-1 flex items-center justify-center animate-fade-in-delay-4">
                <div className="space-y-6">
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    
                    {/* Primary CTA */}
                    <Link href="/eventos" className="group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 group-hover:from-blue-500 group-hover:via-cyan-400 group-hover:to-blue-300 transition-all duration-700" />
                      <div className="relative px-8 sm:px-10 py-3 sm:py-4 text-white font-bold text-base sm:text-lg rounded-xl flex items-center justify-center gap-3 backdrop-blur-sm border border-white/20 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 btn-cultural pulse-glow">
                        <ChileAndesIcon className="w-5 h-5" />
                        <span>Explorar Paisajes Sonoros</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Link>
                    
                    {/* Secondary CTA */}
                    <Link href="#eventos" className="group border-2 border-white/40 hover:border-white/60 text-white hover:bg-white/10 font-bold text-base sm:text-lg py-3 sm:py-4 px-8 sm:px-10 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm shadow-xl hover:shadow-white/20 hover:scale-105">
                      <ChileWindIcon className="w-5 h-5" />
                      <span>Ver Destacados</span>
                    </Link>
                  </div>

                  {/* Scroll Indicator */}
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
          {/* STATS SECTION MEJORADA CON TEMÁTICA CHILENA */}
          {/* ======================================== */}
          <section className="py-20 px-4 relative overflow-hidden bg-pattern-chile">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="flex justify-center mb-6">
                  <ChileAndesIcon className="w-12 h-12 text-blue-500 icon-cultural cultural-pulse" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  Energía Patagónica Electrónica
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  La fuerza de la música electrónica chilena que conecta desierto con fiordos
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/10 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-3 flex items-center justify-center gap-3">
                      {events.length}
                      <ChileLagunaIcon className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Eventos Activos</div>
                    <div className="text-sm text-gray-400 mt-2">Listos para despegar</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/10 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-3 flex items-center justify-center gap-3">
                      15
                      <MapPin className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Regiones Chilenas</div>
                    <div className="text-sm text-gray-400 mt-2">Desde Arica a Magallanes</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/10 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/20 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-3 flex items-center justify-center gap-3">
                      60+
                      <Zap className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">DJ's de la Patagonia</div>
                    <div className="text-sm text-gray-400 mt-2">Guerreros del viento</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Events Section with Chilean Integration */}
      <section id="eventos" className="py-20 px-4 bg-gradient-to-b from-blue-950/30 via-black to-blue-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <ChileAndesIcon className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Próximos Eventos </span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                Patagónicos
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Desde los fiordos del sur hasta el desierto de Atacama, cada evento es un ritual moderno 
              donde la geografía más extrema del mundo se encuentra con el futuro de la música electrónica.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-900/50 rounded-3xl p-12 border border-gray-700/50">
                <ChileWindIcon className="w-24 h-24 text-blue-500/50 mx-auto mb-6" />
                <p className="text-2xl text-gray-300 mb-4">El viento patagónico está preparando algo especial</p>
                <p className="text-gray-500">Próximamente nuevos eventos sagrados se revelarán...</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 9).map((event, index) => (
                <Card key={event.id} className="group overflow-hidden bg-gray-900/50 border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={event.mainImageUrl || '/placeholder-event.jpg'}
                      alt={event.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-blue-500/90 text-white backdrop-blur-sm border-0">
                        {event.eventType === 'festival' ? 'Festival Patagónico' : event.eventType === 'concert' ? 'Ritual del Viento' : 'Círculo del Sur'}
                      </Badge>
                      {event.isHighlighted && (
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                          <Star className="w-4 h-4 text-black" />
                        </div>
                      )}
                    </div>

                    <div className="absolute top-4 right-4">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <ChileWindIcon className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-300 transition-colors line-clamp-2">{event.name}</h3>
                    
                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span>{event.location.city || event.location.venue}, {event.location.region}</span>
                      </div>
                      {event.startTime && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>{event.startTime}</span>
                        </div>
                      )}
                    </div>

                    <Link href={`/eventos/${event.slug}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                        <span>Explorar Paisaje</span>
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
                <Button variant="outline" size="lg" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-300">
                  <ChileAndesIcon className="w-5 h-5 mr-2" />
                  Ver Todos los Eventos Patagónicos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Chilean Cultural Section - "Detrás de la Luna" */}
      <section className="py-16 px-4 bg-gradient-to-b from-blue-950/20 via-black to-blue-950/20 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 opacity-20">
            <ChileAndesIcon className="w-16 h-16 text-blue-500 animate-spin-slow" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-20">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full animate-pulse" />
          </div>
          <div className="absolute top-1/2 left-5 opacity-10">
            <div className="w-8 h-8 bg-cyan-400/30 rounded-full animate-float" />
          </div>
          <div className="absolute top-1/3 right-20 opacity-15">
            <div className="w-6 h-6 bg-blue-400/40 rounded-full animate-float-delay" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Creative Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-400 font-medium text-sm uppercase tracking-wider">Patagonia & Futuro</span>
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                  <span className="text-white">Detrás de la Luna </span>
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    Se BAILA
                  </span>
                </h2>
                
                <p className="text-gray-300 text-lg leading-relaxed">
                  En Chile, la música electrónica no solo conecta corazones, sino que une
                  <span className="text-blue-400 font-semibold"> los paisajes más extremos del mundo</span> con
                  <span className="text-cyan-400 font-semibold"> beats del futuro</span>.
                </p>
              </div>

              {/* Chilean Features */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-900/50 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ChileWindIcon className="w-6 h-6 text-blue-400" />
                    <h3 className="font-semibold text-white">Viento Patagónico</h3>
                  </div>
                  <p className="text-sm text-gray-400">Eventos que cabalgán el viento del fin del mundo</p>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ChileLagunaIcon className="w-6 h-6 text-cyan-400" />
                    <h3 className="font-semibold text-white">Comunidad del Sur</h3>
                  </div>
                  <p className="text-sm text-gray-400">Conectamos ravers de las 15 regiones</p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="pt-4">
                <Link
                  href="/eventos"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30"
                >
                  <span>Únete al Viento</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Chile Landscape Image Placeholder */}
            <div className="relative">
              <div className="relative z-10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-500">
                  <div className="w-full h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <ChileAndesIcon className="w-24 h-24 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-300 font-semibold">Paisaje Chileno</p>
                      <p className="text-gray-400 text-sm">Andes, Fiordos y Beats</p>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-blue-400 text-lg">🌊</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-cyan-500/30 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-cyan-400 text-sm">🎧</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Regions Section with Chilean Design */}
      <section className="py-20 px-4 bg-gradient-to-b from-black via-blue-950/10 to-black">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Background Chilean Elements */}
          <div className="absolute inset-0 opacity-5">
            <ChileAndesIcon className="absolute top-20 right-20 w-24 h-24 cultural-spin" />
            <ChileWindIcon className="absolute bottom-20 left-20 w-20 h-20 particle-float" />
          </div>
          <div className="flex justify-center mb-8">
            <ChileLagunaIcon className="w-16 h-16 text-blue-500" />
          </div>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-white">Territorios </span>
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              del Fin del Mundo
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Explora la música electrónica en las 15 regiones más extremas de Chile
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Arica', count: events.filter(e => e.location.city?.toLowerCase().includes('arica')).length, icon: '🏜️' },
              { name: 'Antofagasta', count: events.filter(e => e.location.city?.toLowerCase().includes('antofagasta')).length, icon: '🏔️' },
              { name: 'Santiago', count: events.filter(e => e.location.city?.toLowerCase().includes('santiago')).length, icon: '🏛️' },
              { name: 'Valparaíso', count: events.filter(e => e.location.city?.toLowerCase().includes('valparaíso')).length, icon: '🌊' },
              { name: 'Concepción', count: events.filter(e => e.location.city?.toLowerCase().includes('concepción')).length, icon: '🏙️' },
              { name: 'Punta Arenas', count: events.filter(e => e.location.city?.toLowerCase().includes('punta arenas')).length, icon: '🐧' }
            ].map((region) => (
              <Link
                key={region.name}
                href={`/eventos?region=${region.name.toLowerCase()}`}
                className="group relative overflow-hidden"
              >
                <div className="bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20 card-cultural interactive-cultural">
                  <div className="text-3xl mb-3">{region.icon}</div>
                  <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-300 transition-colors">{region.name}</h3>
                  <p className="text-sm text-gray-400">{region.count} eventos</p>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChileWindIcon className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Newsletter with Chilean Elements */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-900/20 via-black to-blue-900/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ChileAndesIcon className="absolute top-10 left-10 w-32 h-32 text-white" />
          <ChileLagunaIcon className="absolute bottom-10 right-10 w-24 h-24 text-white" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 rounded-full p-4 backdrop-blur-sm">
              <ChileWindIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Únete al Viento Patagónico
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Recibe las energías más poderosas del sur: preventas exclusivas, lineups sagrados 
            y secretos ancestrales de la música electrónica chilena.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto" aria-label="Suscripción al newsletter de Chile">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Tu email patagónico"
                className="w-full px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:border-white/40 transition-all duration-300"
                aria-label="Dirección de email"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>Montar el Viento</span>
              <Zap className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Viento seguro patagónico</span>
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