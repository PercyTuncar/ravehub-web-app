
import { SchemaGenerator } from './lib/seo/schema-generator';

const realEventData = {
    id: "fTtztdW5msOYfhFCkukJ",
    slug: "boris-brejcha-lima-2025",
    name: "Boris Brejcha Lima 2025",
    description: "Boris Brejcha en Lima. Reflections Tour. Viernes 12 de diciembre 2025, en Peru. Zonas, precios y mapa. Compra tus entradas oficiales aquí.",
    shortDescription: "Compra tus entradas para Boris Brejcha en Lima 2025. Toda la información del concierto, lugar, fecha y tickets en Ravehub ",
    startDate: "2025-12-12",
    startTime: "22:00",
    endDate: "2025-12-13",
    endTime: "04:00",
    doorTime: "20:00",
    timezone: "UTC-05:00",
    eventType: "concert",
    eventStatus: "published",
    eventAttendanceMode: "offline",
    inLanguage: "es-PE",
    currency: "PEN",
    isAccessibleForFree: false,
    location: {
        venue: "Paradiso Lima, Chorrillos",
        address: "Av. Alameda Sur 1530",
        city: "Lima",
        cityCode: "PE-PE-14-0",
        region: "Lima",
        regionCode: "PE-14",
        country: "Peru",
        countryCode: "PE",
        postalCode: "15067",
        geo: {
            lat: -12.2096,
            lng: -77.02053
        }
    },
    organizer: {
        name: "Ravehub",
        email: "contacto@ravehublatam.com",
        phone: "+51944784488",
        website: "https://www.ravehublatam.com/",
        logoUrl: "https://www.ravehublatam.com/icons/apple-touch-icon.png"
    },
    zones: [
        { id: "zone-1762623622378", name: "General 11 PM", capacity: 100, description: "Ingreso antes de las 23:00", isActive: true },
        { id: "zone-1762623649514", name: "General All Day", capacity: 100, description: "", isActive: true },
        { id: "zone-1762623693077", name: "VIP", capacity: 100, description: "", isActive: true },
        { id: "zone-1762623707044", name: "Palco Ultra VIP", capacity: 100, description: "", isActive: true }
    ],
    salesPhases: [
        {
            id: "phase-1762623717933",
            name: "PREVENTA 1",
            startDate: "2025-10-01T20:42:00.000Z",
            endDate: "2025-11-01T07:42:00.000Z",
            status: "expired",
            zonesPricing: [
                { zoneId: "zone-1762623622378", price: 99, available: 100, sold: 0, phaseId: "phase-1762623717933" },
                { zoneId: "zone-1762623649514", price: 150, available: 100, sold: 0, phaseId: "phase-1762623717933" },
                { zoneId: "zone-1762623693077", price: 190, available: 100, sold: 0, phaseId: "phase-1762623717933" },
                { zoneId: "zone-1762623707044", price: 220, available: 100, sold: 0, phaseId: "phase-1762623717933" }
            ]
        },
        {
            id: "phase-1762623809285",
            name: "PREVENTA 2",
            startDate: "2025-11-01T17:43:00.000Z",
            endDate: "2025-12-02T17:43:00.000Z",
            status: "active",
            zonesPricing: [
                { zoneId: "zone-1762623622378", price: 135, available: 100, sold: 0, phaseId: "phase-1762623809285" },
                { zoneId: "zone-1762623649514", price: 155, available: 100, sold: 0, phaseId: "phase-1762623809285" },
                { zoneId: "zone-1762623693077", price: 215, available: 100, sold: 0, phaseId: "phase-1762623809285" },
                { zoneId: "zone-1762623707044", price: 314.92, available: 100, sold: 0, phaseId: "phase-1762623809285" }
            ]
        },
        {
            id: "phase-1762623936740",
            name: "ÚLTIMO LOTE",
            startDate: "2025-12-02T17:45:00.000Z",
            endDate: "2025-11-11T17:45:00.000Z", // Note: This end date in user data seems earlier than start date, might cause issues
            status: "upcoming",
            zonesPricing: [
                { zoneId: "zone-1762623622378", price: 150, available: 100, sold: 0, phaseId: "phase-1762623936740" },
                { zoneId: "zone-1762623649514", price: 170, available: 100, sold: 0, phaseId: "phase-1762623936740" },
                { zoneId: "zone-1762623693077", price: 240, available: 100, sold: 0, phaseId: "phase-1762623936740" },
                { zoneId: "zone-1762623707044", price: 340, available: 100, sold: 0, phaseId: "phase-1762623936740" }
            ]
        }
    ],
    artistLineup: [
        { name: "Boris Brejcha", isHeadliner: true, performanceDate: "2025-12-12", performanceTime: "", stage: "Mainstage", imageUrl: "..." },
        { name: "Moritz Hofbauer", isHeadliner: false, performanceDate: "2025-12-12", performanceTime: "", stage: "Mainstage", imageUrl: "..." },
        { name: "Frieder & Jakob", isHeadliner: false, performanceDate: "2025-12-12", performanceTime: "", stage: "Mainstage", imageUrl: "..." }
    ],
    mainImageUrl: "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/events%2Fimages%2F1762623070873_1jaryd.jpg?alt=media&token=b04bdc1c-ddb8-47da-b38a-62b19fc043c5",
    seoTitle: "Boris Brejcha Lima 2025",
    seoDescription: "Boris Brejcha en Lima. Reflections Tour. Viernes 12 de diciembre 2025, en Peru. Zonas, precios y mapa. Compra tus entradas oficiales aquí.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

try {
    const schemas = SchemaGenerator.prototype.generateEventSchemas(realEventData);
    const fs = require('fs');
    fs.writeFileSync('real_event_schema_debug.json', JSON.stringify(schemas, null, 2));
    console.log('Real event schema written to real_event_schema_debug.json');

    // Log offers specifically
    const eventSchema = schemas.find((s: any) => s['@type'] === 'MusicEvent' || s['@type'] === 'Festival');
    if (eventSchema && eventSchema.offers) {
        console.log('Offers found:', eventSchema.offers.length);
        eventSchema.offers.forEach((offer: any, index: number) => {
            console.log(`Offer ${index + 1}: ${offer.name} - ${offer.price} ${offer.priceCurrency} (Valid: ${offer.validFrom} to ${offer.priceValidUntil})`);
        });
    } else {
        console.log('No offers found in event schema');
    }

} catch (error) {
    console.error(error);
}
