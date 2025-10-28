import type { Metadata } from 'next'
import { getEventsByCountry } from '@/lib/data-fetching'
import { Event } from '@/lib/types'
import JsonLd from '@/components/seo/JsonLd'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Eventos de Música Electrónica en Perú | Ravehub',
  description: 'Descubre todos los eventos de música electrónica en Perú. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más en Lima, Cusco, Arequipa y todo el Perú.',
  keywords: ['eventos Perú', 'música electrónica Perú', 'festivales EDM Perú', 'conciertos Perú', 'techno Perú', 'house Perú', 'trance Perú', 'entradas Perú', 'Lima', 'Cusco', 'Arequipa'],
  alternates: { canonical: 'https://www.weareravehub.com/pe/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.weareravehub.com/pe/',
    title: 'Eventos de Música Electrónica en Perú | Ravehub',
    description: 'Compra entradas oficiales para los mejores eventos de música electrónica en Perú.',
    siteName: 'Ravehub',
    images: [
      {
        url: 'https://www.weareravehub.com/static/og-image-peru.jpg',
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
    images: ['https://www.weareravehub.com/static/og-image-peru.jpg']
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://www.weareravehub.com/pe/#webpage",
      "url": "https://www.weareravehub.com/pe/",
      "name": "Eventos de Música Electrónica en Perú | Ravehub",
      "description": "Descubre todos los eventos de música electrónica en Perú. Compra entradas oficiales para festivales, clubes y conciertos de techno, house, trance y más.",
      "isPartOf": {
        "@id": "https://www.weareravehub.com/#website"
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
    <main className="min-h-screen">
      <JsonLd id="peru-page-jsonld" data={jsonLd} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
            Eventos en Perú
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Descubre la escena electrónica más vibrante de Latinoamérica
          </p>

          {/* Trust Bullets */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm md:text-base" role="list" aria-label="Características de confianza">
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true"></div>
              <span>Entradas 100% oficiales</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true"></div>
              <span>Lineups verificados</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true"></div>
              <span>Soporte en español</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/eventos" className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-center" aria-label="Ver todos los eventos en Perú">
              Ver todos los eventos
            </a>
            <a href="#eventos" className="border-2 border-white text-white hover:bg-white hover:text-red-900 font-semibold py-3 px-8 rounded-lg transition-colors text-center" aria-label="Explorar eventos destacados">
              Explorar destacados
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">{events.length}</div>
              <div className="text-gray-600 dark:text-gray-300">Eventos activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">6</div>
              <div className="text-gray-600 dark:text-gray-300">Ciudades principales</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">DJ's internacionales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="eventos" className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Próximos eventos en Perú</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Desde Lima hasta Cusco, descubre los mejores eventos de música electrónica del Perú.
          </p>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay eventos programados actualmente</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">¡Vuelve pronto para ver las próximas fechas!</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 9).map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={event.mainImageUrl || '/placeholder-event.jpg'}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        {event.eventType === 'festival' ? 'Festival' : event.eventType === 'concert' ? 'Concierto' : 'Club'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.name}</h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location.city || event.location.venue}, {event.location.region}</span>
                      </div>
                      {event.startTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.startTime}</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/eventos/${event.slug}`}>
                      <Button className="w-full bg-red-500 hover:bg-red-600">
                        Ver evento
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {events.length > 9 && (
            <div className="text-center mt-12">
              <Link href="/eventos">
                <Button variant="outline" size="lg">
                  Ver todos los eventos en Perú
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ciudades principales</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Explora eventos por ciudad en Perú
          </p>

          <div className="flex flex-wrap justify-center gap-4" role="list" aria-label="Ciudades principales de Perú">
            {[
              { name: 'Lima', count: events.filter(e => e.location.city?.toLowerCase().includes('lima')).length },
              { name: 'Cusco', count: events.filter(e => e.location.city?.toLowerCase().includes('cusco')).length },
              { name: 'Arequipa', count: events.filter(e => e.location.city?.toLowerCase().includes('arequipa')).length },
              { name: 'Trujillo', count: events.filter(e => e.location.city?.toLowerCase().includes('trujillo')).length },
              { name: 'Piura', count: events.filter(e => e.location.city?.toLowerCase().includes('piura')).length },
              { name: 'Chiclayo', count: events.filter(e => e.location.city?.toLowerCase().includes('chiclayo')).length }
            ].map((city) => (
              <a
                key={city.name}
                href={`/eventos?region=${city.name.toLowerCase()}`}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-800 hover:text-red-900 dark:bg-red-900/20 dark:hover:bg-red-800/30 dark:text-red-200 dark:hover:text-red-100 rounded-full transition-colors"
                aria-label={`Explorar eventos en ${city.name} (${city.count} eventos)`}
                role="listitem"
              >
                {city.name} {city.count > 0 && `(${city.count})`}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-red-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">No te pierdas el próximo rave en Perú</h2>
          <p className="text-red-100 mb-8">
            Recibe preventas exclusivas y lineups de los mejores eventos en Perú.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto" aria-label="Suscripción al newsletter de Perú">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              aria-label="Dirección de email"
              required
            />
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              aria-label="Suscribirse al newsletter"
            >
              Quiero recibir novedades
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}