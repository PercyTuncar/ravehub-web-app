import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { getUpcomingEvents } from '@/lib/data-fetching'
import { Event } from '@/lib/types'
import HeroVideo from '@/components/home/HeroVideo'
import EventCarousel from '@/components/home/EventCarousel'
import CountrySelector from '@/components/home/CountrySelector'
import HowItWorks from '@/components/home/HowItWorks'
import Newsletter from '@/components/home/Newsletter'

// ISR: Revalidate every 10 minutes (600 seconds)
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Ravehub - Eventos de Música Electrónica en Latinoamérica',
  description: 'La plataforma líder en eventos de música electrónica en Latinoamérica. Compra entradas oficiales para festivales y conciertos de música electrónica en Perú, Chile, Ecuador, Colombia, México y Argentina. Pagos seguros, lineups verificados y soporte en español.',
  keywords: ['música electrónica', 'festivales EDM', 'entradas oficiales', 'techno', 'house', 'trance', 'Perú', 'Chile', 'Ecuador', 'Colombia', 'México', 'Argentina', 'ticketing', 'eventos en vivo'],
  alternates: { canonical: 'https://www.ravehublatam.com/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://www.ravehublatam.com/',
    title: 'Ravehub — Música electrónica en Latinoamérica',
    description: 'Compra entradas oficiales y descubre próximos eventos en tu ciudad.',
    siteName: 'Ravehub',
    images: [
      {
        url: 'https://www.ravehublatam.com/static/og-image-home.jpg',
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
    images: ['https://www.ravehublatam.com/static/og-image-home.jpg']
  }
}

const jsonLd = (upcomingEvents: Event[]) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.ravehublatam.com/#organization",
      "name": "Ravehub",
      "legalName": "Ravehub LATAM S.A.C.",
      "alternateName": "Ravehub Latinoamérica",
      "url": "https://www.ravehublatam.com/",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://www.ravehublatam.com/#logo",
        "url": "https://www.ravehublatam.com/static/logo-ravehub.png",
        "contentUrl": "https://www.ravehublatam.com/static/logo-ravehub.png",
        "width": "512",
        "height": "512",
        "caption": "Logo de Ravehub",
        "inLanguage": "es-419"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://www.ravehublatam.com/static/og-image-home.jpg",
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
        "https://twitter.com/ravehublatam",
        "https://www.youtube.com/@ravehublatam", 
        "https://www.linkedin.com/company/ravehublatam"
      ],
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "telephone": "+51-944-784-488",
          "contactType": "customer service",
          "email": "hola@ravehublatam.com",
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
          "email": "ventas@ravehublatam.com",
          "areaServed": ["PE", "CL", "EC", "CO", "MX", "AR"],
         "availableLanguage": ["es", "en"]
        },
        {
          "@type": "ContactPoint",
          "contactType": "technical support",
          "email": "soporte@ravehublatam.com",
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
        "logo": "https://www.ravehublatam.com/static/logo-ravehub.png"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://www.ravehublatam.com/#website",
      "url": "https://www.ravehublatam.com/",
      "name": "Ravehub",
      "alternateName": "Ravehub Latinoamérica",
      "description": "Plataforma de venta de entradas para eventos de música electrónica en Latinoamérica",
      "inLanguage": "es-419",
      "publisher": {
        "@id": "https://www.ravehublatam.com/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.ravehublatam.com/eventos?q={search_term_string}"
        },
        "query-input": {
          "@type": "PropertyValueSpecification",
          "valueRequired": true,
          "valueName": "search_term_string"
        }
      },
      "copyrightYear": new Date().getFullYear().toString(),
      "copyrightHolder": {
        "@id": "https://www.ravehublatam.com/#organization"
      }
    },
    {
      "@type": ["WebPage", "CollectionPage"],
      "@id": "https://www.ravehublatam.com/#webpage",
      "url": "https://www.ravehublatam.com/",
      "name": "Inicio — Ravehub | Entradas para Festivales de Música Electrónica en Latinoamérica",
      "description": "Compra entradas oficiales para festivales, clubes y conciertos de música electrónica en Perú, Chile, Ecuador, Colombia, México y Argentina. Pagos seguros, lineups verificados y soporte en español.",
      "isPartOf": {
        "@id": "https://www.ravehublatam.com/#website"
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
        "@id": "https://www.ravehublatam.com/#primaryimage",
        "url": "https://www.ravehublatam.com/static/og-image-home.jpg",
        "contentUrl": "https://www.ravehublatam.com/static/og-image-home.jpg",
        "width": "1200",
        "height": "630",
        "caption": "Ravehub - Plataforma de entradas para música electrónica en Latinoamérica",
        "inLanguage": "es-419"
      },
      "breadcrumb": {
        "@id": "https://www.ravehublatam.com/#breadcrumb"
      },
      "mainEntity": {
        "@id": "https://www.ravehublatam.com/#organization"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".text-base", "h2"]
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.ravehublatam.com/#breadcrumb",
      "name": "Ruta de navegación",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": {
            "@type": "WebPage",
            "@id": "https://www.ravehublatam.com/"
          }
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.ravehublatam.com/#faqpage",
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
            "text": "Inicia sesión en ravehublatam.com y dirígete a la sección 'Mis Tickets' en tu perfil. Ahí encontrarás todas tus entradas activas, historial de compras y podrás descargar los códigos QR. También recibes los e-tickets por email inmediatamente después de cada compra. Próximamente estará disponible nuestra app móvil para acceso aún más rápido."
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
      "@id": "https://www.ravehublatam.com/#service",
      "serviceType": "Venta de entradas para eventos",
      "provider": {
        "@id": "https://www.ravehublatam.com/#organization"
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
      "@id": "https://www.ravehublatam.com/#countrylist",
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
            "url": "https://www.ravehublatam.com/pe/",
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
            "url": "https://www.ravehublatam.com/cl/",
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
            "url": "https://www.ravehublatam.com/ec/",
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
            "url": "https://www.ravehublatam.com/co/",
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
            "url": "https://www.ravehublatam.com/mx/",
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
            "url": "https://www.ravehublatam.com/ar/",
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
  const upcomingEvents = await getUpcomingEvents(12); // Obtener más eventos para el carousel

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD for SEO */}
      <JsonLd id="homepage-jsonld" data={jsonLd(upcomingEvents)} />

      {/* Hero Section */}
      <HeroVideo
        title="Vive la música electrónica en Latinoamérica"
        subtitle="La plataforma líder en eventos de música electrónica"
        description="Compra entradas oficiales para festivales, clubes y conciertos en Perú, Chile, Ecuador, Colombia, México y Argentina. Pagos seguros, lineups verificados y soporte en español."
        ctaPrimary={{
          label: "Comprar entradas",
          href: "/eventos"
        }}
        ctaSecondary={{
          label: "Ver eventos",
          href: "/eventos"
        }}
        videoSources={{
          avif: "/videos/hero-background.avif",
          webm: "/videos/hero-background.webm",
          mp4: "/videos/hero-background.mp4"
        }}
        posterImage="/images/hero-poster.jpg"
        fallbackImage="/images/hero-fallback.jpg"
        trustIndicators={[
          { icon: "🛡️", text: "Entradas 100% oficiales y seguras" },
          { icon: "💳", text: "Pagos flexibles y locales" },
          { icon: "⭐", text: "Lineups verificados" },
          { icon: "🇪🇸", text: "Soporte en español" }
        ]}
      />

      {/* Events Carousel */}
      <EventCarousel
        events={upcomingEvents}
        title="Próximos eventos destacados"
        subtitle="Descubre los sets imperdibles que vienen a tu ciudad. Compra con anticipación y asegura tu lugar en la pista."
      />

      {/* Country Selector */}
      <CountrySelector />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Newsletter Section */}
      <Newsletter />

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Preguntas frecuentes
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Todo lo que necesitas saber sobre Ravehub
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "¿Cómo funcionan los e-tickets?",
                answer: "Tu e-ticket es digital y llega a tu email inmediatamente después del pago. También lo encuentras en tu cuenta de Ravehub en la sección 'Mis Tickets'. En la entrada del evento, presenta el código QR desde tu celular, no es necesario imprimirlo."
              },
              {
                question: "¿Qué medios de pago aceptan?",
                answer: "Aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express, transferencias bancarias, y métodos de pago locales como Yape (Perú), Mercado Pago, Nequi (Colombia) y más."
              },
              {
                question: "¿Qué pasa si se reprograma el evento?",
                answer: "Si el organizador reprograma el evento, tu entrada es válida automáticamente para la nueva fecha. Si la nueva fecha no te funciona, puedes solicitar reembolso completo dentro de los 7 días del anuncio."
              },
              {
                question: "¿Dónde veo mis entradas?",
                answer: "Inicia sesión en ravehublatam.com y dirígete a la sección 'Mis Tickets' en tu perfil. Ahí encontrarás todas tus entradas activas, historial de compras y podrás descargar los códigos QR."
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-200"
              >
                <summary className="font-semibold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* Organizers CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg mb-6">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Para Organizadores</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                ¿Organizas eventos?
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Únete a la plataforma líder de música electrónica en Latinoamérica.
                Gestiona tus eventos, vende entradas y conecta con miles de ravers.
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {[
                  {
                    title: "Analytics avanzados",
                    description: "Reportes en tiempo real de ventas y asistencia"
                  },
                  {
                    title: "Pagos seguros",
                    description: "Procesamiento automático con múltiples métodos"
                  },
                  {
                    title: "Marketing incluido",
                    description: "Promoción automática en nuestra red de fans"
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: CTA Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Comienza hoy mismo
                  </h3>
                  <p className="text-gray-600">
                    Más de 1,030+ eventos ya confían en nuestra plataforma
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-200">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">98%</div>
                    <div className="text-sm text-gray-600">Satisfacción</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Soporte</div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/contact"
                    className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Contactar Ventas
                  </Link>
                  
                  <Link
                    href="/eventos"
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Ver Eventos Existentes
                  </Link>
                </div>

                {/* Trust indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Setup gratuito • Sin comisiones por configuración</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}