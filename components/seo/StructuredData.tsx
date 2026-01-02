import { Event } from '@/lib/types';
import Script from 'next/script';

interface StructuredDataProps {
    event: Event;
}

export default function StructuredData({ event }: StructuredDataProps) {
    // 1. Filtrar la fase activa para precios reales
    const activePhase = event.salesPhases.find(p => {
        if (!p.startDate) return false;
        const now = new Date();
        const startDate = new Date(p.startDate);
        const endDate = p.endDate ? new Date(p.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
        return now >= startDate && now <= endDate;
    }) || event.salesPhases[0];

    // 2. Construir ofertas dinámicas basándonos en la moneda de la DB
    const offers = activePhase?.zonesPricing ? activePhase.zonesPricing.map(pricing => {
        const zoneName = event.zones?.find(z => z.id === pricing.zoneId)?.name || 'General';
        return {
            "@type": "Offer",
            "name": `${zoneName} - ${activePhase.name}`,
            "price": pricing.price,
            "priceCurrency": event.currency || 'PEN',
            "availability": pricing.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `https://www.ravehublatam.com/eventos/${event.slug}/entradas`,
            "validFrom": activePhase.startDate,
            "priceValidUntil": activePhase.endDate || event.endDate
        };
    }) : [];

    // 3. Construir FAQ Schema desde tu DB
    const faqSchema = event.faqSection && event.faqSection.length > 0 ? {
        "@type": "FAQPage",
        "mainEntity": event.faqSection.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    } : null;

    // 4. Schema Principal (Event + Offers)
    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.name,
        "startDate": event.startTime ? `${event.startDate.split('T')[0]}T${event.startTime}` : event.startDate,
        "endDate": event.endDate && event.endTime ? `${event.endDate.split('T')[0]}T${event.endTime}` : (event.endDate || event.startDate),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": event.location.venue,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": event.location.address,
                "addressLocality": event.location.city,
                "addressCountry": event.location.countryCode || 'PE'
            },
            "geo": event.location.geo ? {
                "@type": "GeoCoordinates",
                "latitude": event.location.geo.lat,
                "longitude": event.location.geo.lng
            } : undefined
        },
        "image": [
            event.mainImageUrl,
            event.squareImageUrl,
            ...(event.imageGallery || [])
        ].filter(Boolean),
        "description": event.description,
        "performer": event.artistLineupIds && event.artistLineupIds.length > 0 ? event.artistLineupIds.map(artistId => ({
            "@type": "PerformingGroup",
            "name": artistId // TODO: Fetch Artist Name if possible, for now using ID/Name as placeholder
        })) : undefined,
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": event.currency || 'PEN',
            "lowPrice": offers.length > 0 ? Math.min(...offers.map(o => o.price)) : 0,
            "highPrice": offers.length > 0 ? Math.max(...offers.map(o => o.price)) : 0,
            "offerCount": offers.length,
            "offers": offers
        },
        "organizer": {
            "@type": "Organization",
            "name": event.organizer?.name || 'RaveHub',
            "url": event.organizer?.website || 'https://www.ravehublatam.com'
        }
    };

    // 5. Breadcrumb Schema (Vital para estructura de sitio)
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Eventos", "item": "https://www.ravehublatam.com/eventos" },
            { "@type": "ListItem", "position": 2, "name": event.name, "item": `https://www.ravehublatam.com/eventos/${event.slug}` },
            { "@type": "ListItem", "position": 3, "name": "Entradas", "item": `https://www.ravehublatam.com/eventos/${event.slug}/entradas` }
        ]
    };

    return (
        <>
            <Script id="event-schema" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(eventSchema)}
            </Script>
            {faqSchema && (
                <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
                    {JSON.stringify(faqSchema)}
                </Script>
            )}
            <Script id="breadcrumb-schema" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(breadcrumbSchema)}
            </Script>
        </>
    );
}
