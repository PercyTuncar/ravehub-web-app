import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { getUpcomingEvents } from '@/lib/data-fetching'
import { Event } from '@/lib/types'

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Ravehub - Eventos de Música Electrónica en Latinoamérica',
  description: 'La plataforma líder en eventos de música electrónica en Latinoamérica. Compra entradas oficiales para festivales y conciertos de música electrónica en Perú, Chile, Ecuador, Colombia, México y Argentina. Pagos seguros, lineups verificados y soporte en español.',
  keywords: ['música electrónica', 'festivales EDM', 'entradas oficiales', 'techno', 'house', 'trance', 'Perú', 'Chile', 'Ecuador', 'Colombia', 'México', 'Argentina', 'ticketing', 'eventos en vivo'],
  alternates: { canonical: 'https://www.weareravehub.com/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.weareravehub.com/',
    title: 'Ravehub — Música electrónica en Latinoamérica',
    description: 'Compra entradas oficiales y descubre próximos eventos en tu ciudad.',
    siteName: 'Ravehub',
    images: [
      {
        url: 'https://www.weareravehub.com/static/og-image-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Ravehub - Plataforma de entradas para música electrónica en Latinoamérica'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ravehub — Música electrónica en Latinoamérica',
    description: 'Entradas oficiales y próximos eventos en Perú, Chile, Ecuador, Colombia, México y Argentina.',
    images: ['https://www.weareravehub.com/static/og-image-home.jpg']
  }
}

const jsonLd = (upcomingEvents: Event[]) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.weareravehub.com/#organization",
      "name": "Ravehub",
      "legalName": "Ravehub LATAM S.A.C.",
      "alternateName": "Ravehub Latinoamérica",
      "url": "https://www.weareravehub.com/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://www.weareravehub.com/#logo",
        "url": "https://www.weareravehub.com/static/logo-ravehub.png",
        "contentUrl": "https://www.weareravehub.com/static/logo-ravehub.png",
        "width": "512",
        "height": "512",
        "caption": "Logo de Ravehub",
        "inLanguage": "es-419"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://www.weareravehub.com/static/og-image-home.jpg",
        "width": "1200",
        "height": "630"
      },
      "description": "Plataforma líder de venta de entradas para festivales y conciertos de música electrónica en Latinoamérica. Venta oficial de tickets con pagos seguros y verificación de lineups.",
      "slogan": "Vive la música electrónica en Latinoamérica",
      "foundingDate": "2025",
      "foundingLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Lima",
          "addressCountry": "PE"
        }
      },
      "knowsAbout": [
        "Música electrónica",
        "Festivales EDM",
        "Venta de entradas",
        "Techno",
        "House",
        "Trance",
        "Eventos en vivo",
        "Ticketing"
      ],
      "sameAs": [
        "https://www.instagram.com/ravehub.pe/",
        "https://www.tiktok.com/@ravehub.pe",
        "https://www.facebook.com/ravehub",
        "https://twitter.com/weareravehub",
        "https://www.youtube.com/@weareravehub",
        "https://open.spotify.com/user/weareravehub",
        "https://www.linkedin.com/company/weareravehub"
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+51-944-784-488",
          "contactType": "customer service",
          "email": "hola@weareravehub.com",
          "areaServed": ["PE", "CL", "EC", "CO", "MX", "AR"],
          "availableLanguage": ["es", "en"],
          "contactOption": "TollFree",
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "09:00",
            "closes": "23:00"
          }
        },
        {
          "@type": "ContactPoint",
          "contactType": "sales",
          "email": "ventas@weareravehub.com",
          "areaServed": ["PE", "CL", "EC", "CO", "MX", "AR"],
         "availableLanguage": ["es", "en"]
        },
        {
          "@type": "ContactPoint",
          "contactType": "technical support",
          "email": "soporte@weareravehub.com",
          "areaServed": ["PE", "CL", "EC", "CO", "MX", "AR"],
          "availableLanguage": ["es"]
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Av. Primavera 123, Piso 5, Oficina 502",
        "addressLocality": "Lima",
        "addressRegion": "Lima",
        "postalCode": "15074",
      "addressCountry": "PE"
      },
      "areaServed": [
        {
          "@type": "Country",
          "name": "Perú",
          "sameAs": "https://en.wikipedia.org/wiki/Peru",
          "alternateName": "PE"
        },
        {
          "@type": "Country",
          "name": "Chile",
          "sameAs": "https://en.wikipedia.org/wiki/Chile",
          "alternateName": "CL"
        },
        {
          "@type": "Country",
          "name": "Ecuador",
          "sameAs": "https://en.wikipedia.org/wiki/Ecuador",
          "alternateName": "EC"
        },
        {
          "@type": "Country",
          "name": "Colombia",
          "sameAs": "https://en.wikipedia.org/wiki/Colombia",
          "alternateName": "CO"
        },
        {
          "@type": "Country",
          "name": "México",
          "sameAs": "https://en.wikipedia.org/wiki/Mexico",
          "alternateName": "MX"
        },
        {
          "@type": "Country",
          "name": "Argentina",
          "sameAs": "https://en.wikipedia.org/wiki/Argentina",
          "alternateName": "AR"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "1247",
        "reviewCount": "892"
      },
      "brand": {
        "@type": "Brand",
        "name": "Ravehub",
        "logo": "https://www.weareravehub.com/static/logo-ravehub.png"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.weareravehub.com/#website",
      "url": "https://www.weareravehub.com/",
      "name": "Ravehub",
      "alternateName": "Ravehub Latinoamérica",
      "description": "Plataforma de venta de entradas para eventos de música electrónica en Latinoamérica",
      "inLanguage": "es-419",
      "publisher": {
        "@id": "https://www.weareravehub.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.weareravehub.com/eventos?q={search_term_string}"
        },
        "query-input": {
          "@type": "PropertyValueSpecification",
          "valueRequired": true,
          "valueName": "search_term_string"
        }
      },
      "copyrightYear": new Date().getFullYear().toString(),
      "copyrightHolder": {
        "@id": "https://www.weareravehub.com/#organization"
      }
    },
    {
      "@type": ["WebPage", "CollectionPage"],
      "@id": "https://www.weareravehub.com/#webpage",
      "url": "https://www.weareravehub.com/",
      "name": "Inicio — Ravehub | Entradas para Festivales de Música Electrónica en Latinoamérica",
      "description": "Compra entradas oficiales para festivales, clubes y conciertos de música electrónica en Perú, Chile, Ecuador, Colombia, México y Argentina. Pagos seguros, lineups verificados y soporte en español.",
      "isPartOf": {
        "@id": "https://www.weareravehub.com/#website"
      },
      "about": {
        "@type": "Thing",
        "name": "Eventos de música electrónica y venta de entradas en Latinoamérica",
        "description": "Plataforma especializada en ticketing para festivales EDM, techno, house, trance y eventos de música electrónica",
        "sameAs": "https://en.wikipedia.org/wiki/Electronic_dance_music"
      },
      "inLanguage": "es-419",
      "datePublished": "2025-10-26T00:00:00+00:00",
      "dateModified": new Date().toISOString(),
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "@id": "https://www.weareravehub.com/#primaryimage",
        "url": "https://www.weareravehub.com/static/og-image-home.jpg",
        "contentUrl": "https://www.weareravehub.com/static/og-image-home.jpg",
        "width": "1200",
        "height": "630",
        "caption": "Ravehub - Plataforma de entradas para música electrónica en Latinoamérica",
        "inLanguage": "es-419"
      },
      "breadcrumb": {
        "@id": "https://www.weareravehub.com/#breadcrumb"
      },
      "mainEntity": {
        "@id": "https://www.weareravehub.com/#organization"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".hero-subtitle", "h2"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.weareravehub.com/#breadcrumb",
      "name": "Ruta de navegación",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": {
            "@type": "WebPage",
            "@id": "https://www.weareravehub.com/"
          }
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.weareravehub.com/#faqpage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Cómo funcionan los e-tickets de Ravehub?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tu e-ticket es digital y llega a tu email inmediatamente después del pago. También lo encuentras en tu cuenta de Ravehub en la sección 'Mis Tickets'. En la entrada del evento, presenta el código QR desde tu celular, no es necesario imprimirlo. Recomendamos tomar un screenshot como backup por si no tienes señal de internet en el momento del ingreso."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué medios de pago aceptan en Ravehub?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express, transferencias bancarias, y métodos de pago locales como Yape (Perú), Mercado Pago (Chile, Argentina, México, Colombia), Nequi (Colombia), Pago Móvil (Venezuela) y más. Puedes pagar hasta en 6 cuotas sin interés con algunas tarjetas de crédito participantes."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué pasa si se reprograma o cancela el evento?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Si el organizador reprograma el evento, tu entrada es válida automáticamente para la nueva fecha y recibirás un email con los detalles actualizados. Si la nueva fecha no te funciona, puedes solicitar reembolso completo dentro de los 7 días del anuncio de reprogramación. Si el evento se cancela definitivamente, recibirás reembolso automático del 100% del valor de tu entrada en un plazo máximo de 30 días."
          }
        },
        {
          "@type": "Question",
          "name": "¿Dónde puedo ver mis entradas compradas?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inicia sesión en weareravehub.com y dirígete a la sección 'Mis Tickets' en tu perfil. Ahí encontrarás todas tus entradas activas, historial de compras y podrás descargar los códigos QR. También recibes los e-tickets por email inmediatamente después de cada compra. Próximamente estará disponible nuestra app móvil para acceso aún más rápido."
          }
        },
        {
          "@type": "Question",
          "name": "¿Puedo transferir mi entrada a otra persona?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, puedes transferir tu entrada a otra persona hasta 48 horas antes del inicio del evento. Desde tu cuenta, ve a 'Mis Tickets', selecciona el evento y haz clic en 'Transferir entrada'. Ingresa el email de la persona receptora, quien debe tener cuenta en Ravehub (o crear una gratuita). La transferencia es gratuita y el nuevo titular recibirá su e-ticket actualizado."
          }
        },
        {
          "@type": "Question",
          "name": "¿Son seguras las compras en Ravehub?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutamente. Usamos encriptación SSL de nivel bancario (certificado TLS 1.3) y trabajamos exclusivamente con procesadores de pago certificados PCI DSS. Nunca almacenamos datos completos de tarjetas de crédito en nuestros servidores. Además, verificamos manualmente cada evento publicado para combatir la reventa y fraudes. Todas las entradas incluyen códigos QR únicos con tecnología anti-falsificación."
          }
        },
        {
          "@type": "Question",
          "name": "¿Ravehub cobra comisión por servicio?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sí, aplicamos una comisión por servicio que varía según el evento y el país (generalmente entre 8% y 15% del valor de la entrada). Esta comisión cubre los costos de procesamiento de pagos, tecnología de la plataforma, atención al cliente 24/7 y protección contra fraudes. El precio final siempre se muestra claramente antes de confirmar tu compra, sin cargos ocultos."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué géneros de música electrónica tienen en Ravehub?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En Ravehub encontrarás eventos de todos los géneros de música electrónica: Techno, House, Trance, Progressive, Dubstep, Drum & Bass, Hardstyle, Hardcore, Minimal, Deep House, Tech House, Melodic Techno, Psytrance y más. Cubrimos desde festivales masivos hasta eventos underground en clubes íntimos de toda Latinoamérica."
          }
        }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://www.weareravehub.com/#service",
      "serviceType": "Venta de entradas para eventos",
      "provider": {
        "@id": "https://www.weareravehub.com/#organization"
      },
      "areaServed": [
        {
          "@type": "Country",
          "name": "Perú"
        },
        {
          "@type": "Country",
          "name": "Chile"
        },
        {
          "@type": "Country",
          "name": "Ecuador"
        },
        {
          "@type": "Country",
          "name": "Colombia"
        },
        {
          "@type": "Country",
          "name": "México"
        },
        {
          "@type": "Country",
          "name": "Argentina"
        }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Catálogo de eventos",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Venta de entradas para festivales de música electrónica",
              "description": "Acceso a los mejores festivales EDM de Latinoamérica"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Venta de entradas para clubes nocturnos",
              "description": "Reserva tu entrada a los mejores clubs de techno y house"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Venta de entradas para conciertos de DJs",
              "description": "Shows en vivo de los mejores DJs internacionales"
            }
          }
        ]
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "15",
        "highPrice": "500",
        "offerCount": upcomingEvents.length.toString()
      },
      "audience": {
  "@type": "Audience",
  "audienceType": "Fans de música electrónica",
  "geographicArea": [
    { "@type": "Country", "name": "Perú" },
    { "@type": "Country", "name": "Chile" },
    { "@type": "Country", "name": "Ecuador" },
    { "@type": "Country", "name": "Colombia" },
    { "@type": "Country", "name": "México" },
    { "@type": "Country", "name": "Argentina" }
  ]
}
    },
    {
      "@type": "ItemList",
      "@id": "https://www.weareravehub.com/#countrylist",
      "name": "Países donde opera Ravehub",
      "description": "Ravehub ofrece venta de entradas en 6 países de Latinoamérica",
      "numberOfItems": 6,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Place",
            "name": "Perú",
            "url": "https://www.weareravehub.com/pe/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "PE"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Place",
            "name": "Chile",
            "url": "https://www.weareravehub.com/cl/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CL"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Place",
            "name": "Ecuador",
            "url": "https://www.weareravehub.com/ec/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "EC"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 4,
          "item": {
            "@type": "Place",
            "name": "Colombia",
            "url": "https://www.weareravehub.com/co/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CO"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 5,
          "item": {
            "@type": "Place",
            "name": "México",
            "url": "https://www.weareravehub.com/mx/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "MX"
            }
          }
        },
        {
          "@type": "ListItem",
          "position": 6,
          "item": {
            "@type": "Place",
            "name": "Argentina",
            "url": "https://www.weareravehub.com/ar/",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "AR"
            }
          }
        }
      ]
    }
  ]
});

export default async function HomePage() {
  const upcomingEvents = await getUpcomingEvents(3);

  return (
    <main className="min-h-screen">
      <JsonLd id="homepage-jsonld" data={jsonLd(upcomingEvents)} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
            Vive la música electrónica en Latinoamérica
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 hero-subtitle">
            Compra entradas oficiales para festivales, clubes y conciertos en Perú, Chile, Ecuador, Colombia, México y Argentina.
          </p>

          {/* Trust Bullets */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm md:text-base" role="list" aria-label="Características de confianza">
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true"></div>
              <span>Entradas 100% oficiales y seguras</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true"></div>
              <span>Pagos flexibles y locales</span>
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
            <Link href="/eventos" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-center" aria-label="Ir a comprar entradas">
              Comprar entradas
            </Link>
            <Link href="/eventos" className="border-2 border-white text-white hover:bg-white hover:text-orange-900 font-semibold py-3 px-8 rounded-lg transition-colors text-center" aria-label="Ver próximos eventos">
              Ver próximos eventos
            </Link>
          </div>
        </div>
      </section>

      {/* Próximos eventos destacados */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Próximos eventos destacados</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Descubre los sets imperdibles que vienen a tu ciudad. Compra con anticipación y asegura tu lugar en la pista.
          </p>

          {/* Dynamic events from database */}
          <div className="grid md:grid-cols-3 gap-8">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div
                    className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 bg-cover bg-center"
                    style={{ backgroundImage: event.mainImageUrl ? `url(${event.mainImageUrl})` : undefined }}
                  ></div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {event.location.city || event.location.venue}, {event.location.country}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {new Date(event.startDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <Link
                      href={`/eventos/${event.slug}`}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors block text-center"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback when no events are available
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Próximamente más eventos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explora por país */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explora por país</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Encuentra eventos y tickets por país y ciudad.
          </p>

          <div className="flex flex-wrap justify-center gap-4" role="list" aria-label="Países disponibles">
            {[
              { name: 'Perú', code: 'pe' },
              { name: 'Chile', code: 'cl' },
              { name: 'Ecuador', code: 'ec' },
              { name: 'Colombia', code: 'co' },
              { name: 'México', code: 'mx' },
              { name: 'Argentina', code: 'ar' }
            ].map((country) => (
              <Link
                key={country.code}
                href={`/${country.code}/`}
                className="px-6 py-3 bg-orange-50 hover:bg-orange-100 text-orange-800 hover:text-orange-900 dark:bg-orange-900/20 dark:hover:bg-orange-800/30 dark:text-orange-200 dark:hover:text-orange-100 rounded-full transition-colors"
                aria-label={`Explorar eventos en ${country.name}`}
                role="listitem"
              >
                {country.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compra fácil y segura</h2>

          <div className="grid md:grid-cols-4 gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Elige tu evento</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Selecciona tus entradas</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Paga en minutos</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="font-semibold mb-2">Recibe tu e-ticket</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Para fans y promotores */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Hecho para ravers y organizadores</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-4">Para Fans</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Acceso anticipado, recordatorios y beneficios de preventa.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-4">Para Promotores</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Publica tu evento, automatiza ventas y reportes en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Confianza & seguridad */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tu seguridad es primero</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Procesamos pagos con partners confiables, protegemos tus datos y verificamos lineups para combatir la reventa.
          </p>
        </div>
      </section>

      {/* Contenido/Blog */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Guías y cultura electrónica</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Crónicas, entrevistas y guías para vivir la escena al máximo.
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-orange-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">No te pierdas el próximo rave</h2>
          <p className="text-orange-100 mb-8">
            Recibe preventas, lineups y noticias.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto" aria-label="Suscripción al newsletter">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              aria-label="Dirección de email"
              required
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              aria-label="Suscribirse al newsletter"
            >
              Quiero recibir novedades
            </button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Preguntas frecuentes</h2>

          <div className="space-y-6" role="region" aria-label="Preguntas frecuentes">
            {[
              {
                question: "¿Cómo funcionan los e-tickets?",
                answer: "Tu e-ticket es digital y llega a tu email inmediatamente después del pago. También lo encuentras en tu cuenta de Ravehub en la sección 'Mis Tickets'. En la entrada del evento, presenta el código QR desde tu celular, no es necesario imprimirlo. Recomendamos tomar un screenshot como backup por si no tienes señal de internet en el momento del ingreso."
              },
              {
                question: "¿Qué medios de pago aceptan?",
                answer: "Aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express, transferencias bancarias, y métodos de pago locales como Yape (Perú), Mercado Pago (Chile, Argentina, México, Colombia), Nequi (Colombia), Pago Móvil (Venezuela) y más. Puedes pagar hasta en 6 cuotas sin interés con algunas tarjetas de crédito participantes."
              },
              {
                question: "¿Qué pasa si se reprograma el evento?",
                answer: "Si el organizador reprograma el evento, tu entrada es válida automáticamente para la nueva fecha y recibirás un email con los detalles actualizados. Si la nueva fecha no te funciona, puedes solicitar reembolso completo dentro de los 7 días del anuncio de reprogramación. Si el evento se cancela definitivamente, recibirás reembolso automático del 100% del valor de tu entrada en un plazo máximo de 30 días."
              },
              {
                question: "¿Dónde veo mis entradas?",
                answer: "Inicia sesión en weareravehub.com y dirígete a la sección 'Mis Tickets' en tu perfil. Ahí encontrarás todas tus entradas activas, historial de compras y podrás descargar los códigos QR. También recibes los e-tickets por email inmediatamente después de cada compra. Próximamente estará disponible nuestra app móvil para acceso aún más rápido."
              }
            ].map((faq, index) => (
              <details key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm group">
                <summary className="font-semibold text-lg mb-2 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-orange-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
                </summary>
                <p className="text-gray-600 dark:text-gray-300 mt-4">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}