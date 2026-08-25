import type { Metadata } from 'next'
import { getEventsByCountry } from '@/lib/data-fetching'
import { Event } from '@/lib/types'
import JsonLd from '@/components/seo/JsonLd'
import { CountrySchemaGenerator } from '@/lib/seo/country-schema-generator'
import { generateMetadataForCountry, generateSEOContent } from '@/lib/seo/generate-country-pages'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, ArrowRight, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CountryFAQ } from '@/components/seo/CountryFAQ'
import { COUNTRY_FAQS } from '@/lib/seo/country-faqs'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { CountryAbout } from '@/components/seo/CountryAbout'
import { COUNTRY_ABOUT } from '@/lib/seo/country-about'

export const revalidate = 600

async function getColombiaEvents(): Promise<Event[]> {
  try {
    const { events } = await getEventsByCountry('CO')
    return events
  } catch (error) {
    console.error('Error loading Colombia events:', error)
    return []
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const events = await getColombiaEvents()
  return generateMetadataForCountry('CO', events) || {
    title: 'Eventos de Música Electrónica en Colombia | Ravehub',
    description: 'Descubre eventos de música electrónica en Colombia'
  }
}

export default async function ColombiaPage() {
  const events = await getColombiaEvents()
  const schemaGenerator = new CountrySchemaGenerator('CO')
  const jsonLd = schemaGenerator.generateCountryPageSchema(events)
  const seoContent = generateSEOContent('CO', events)

  const upcomingEvents = events.filter(e => new Date(e.startDate) >= new Date())

  return (
    <main className="min-h-screen bg-black">
      <JsonLd id="colombia-page-jsonld" data={jsonLd} />

      <Breadcrumbs items={[
        { label: 'Eventos', href: '/eventos' },
        { label: 'Colombia', href: '/co' }
      ]} />

      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" preload="auto">
          <source src="/videos/colombia-hero-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/85" />
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-900/25 via-transparent to-black/35" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 w-full">
          <div className="grid grid-rows-3 gap-8 h-[80vh]">
            <div className="row-span-2 flex items-center justify-center">
              <div className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <div className="text-white mb-3">Eventos de Música Electrónica en</div>
                  <div className="text-yellow-500 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold">Colombia</div>
                </h1>
              </div>
            </div>

            <div className="row-span-1 flex items-center justify-center">
              <div className="max-w-3xl mx-auto text-center">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed font-light">
                  {seoContent?.bodyText}
                </p>
                {upcomingEvents.length > 0 && <p className="text-sm text-gray-400 mt-4">{seoContent?.statsText}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-30 -mt-20">
        <div className="h-20 bg-gradient-to-b from-transparent to-black" />
        <div className="bg-black">
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Música Electrónica en Todo Colombia
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Festivales y eventos de techno, house, trance y más géneros en las principales ciudades del país
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-3xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-3">{upcomingEvents.length}</div>
                    <div className="text-gray-200 text-lg font-medium">Eventos Próximos</div>
                    <div className="text-sm text-gray-400 mt-2">En todo Colombia</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-3xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-3 flex items-center justify-center gap-3">
                      {[...new Set(events.map(e => e.location.city))].filter(Boolean).length}
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Ciudades</div>
                    <div className="text-sm text-gray-400 mt-2">Bogotá, Medellín y más</div>
                  </div>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-3xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500 hover:scale-105">
                    <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-3 flex items-center justify-center gap-3">
                      {events.reduce((acc, e) => acc + (e.artistLineup?.length || 0), 0)}
                      <Zap className="w-8 h-8" />
                    </div>
                    <div className="text-gray-200 text-lg font-medium">Artistas</div>
                    <div className="text-sm text-gray-400 mt-2">DJs nacionales e internacionales</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section id="eventos" className="py-20 px-4 bg-gradient-to-b from-yellow-950/30 via-black to-yellow-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">{seoContent?.eventsSectionTitle}</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{seoContent?.eventsSectionDescription}</p>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-900/50 rounded-3xl p-12 border border-gray-700/50">
                <p className="text-2xl text-gray-300 mb-4">Próximamente nuevos eventos</p>
                <p className="text-gray-500">Mantente atento a las novedades de música electrónica en Colombia</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingEvents.slice(0, 9).map((event) => (
                  <Card key={event.id} className="group overflow-hidden bg-gray-900/50 border-gray-700/50 hover:border-yellow-500/50 transition-all duration-500">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={event.mainImageUrl || '/placeholder-event.jpg'}
                        alt={`${event.name} - Evento de música electrónica en ${event.location.city}, Colombia`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-yellow-500/90 text-black backdrop-blur-sm border-0">
                          {event.eventType === 'festival' ? 'Festival' : 'Evento'}
                        </Badge>
                        {event.isHighlighted && (
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                            <Star className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl mb-3 text-white group-hover:text-yellow-300 transition-colors line-clamp-2">{event.name}</h3>
                      <div className="space-y-3 text-sm mb-6">
                        <div className="flex items-center gap-3 text-gray-400">
                          <Calendar className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium">{format(new Date(event.startDate), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          <MapPin className="w-4 h-4 text-yellow-400" />
                          <span>{event.location.city || event.location.venue}, {event.location.region}</span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-3 text-gray-400">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span>{event.startTime}</span>
                          </div>
                        )}
                      </div>
                      <Link href={`/eventos/${event.slug}`} className="block">
                        <Button className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                          <span>Ver Entradas</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {upcomingEvents.length > 9 && (
                <div className="text-center mt-16">
                  <Link href="/eventos?country=CO">
                    <Button variant="outline" size="lg" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">
                      {seoContent?.ctaText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CountryAbout data={COUNTRY_ABOUT.CO} />

      <CountryFAQ countryName="Colombia" faqs={COUNTRY_FAQS.CO} />
    </main>
  )
}
