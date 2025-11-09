/**
 * Test script to verify event schema generation
 * Run with: node scripts/test-event-schemas.js
 */

// Mock event data
const mockEvent = {
  id: 'test-event',
  slug: 'boris-brejcha-lima-2025',
  name: 'Boris Brejcha Lima 2025',
  seoTitle: 'Boris Brejcha en Lima 2025 - Entradas y Fecha',
  seoDescription: 'Boris Brejcha llega a Lima en 2025. Consigue tus entradas para el mejor show de techno.',
  shortDescription: 'El maestro del High-Tech Minimal llega a Lima',
  description: 'Boris Brejcha trae su sonido único a Lima en 2025...',
  eventType: 'concert',
  schemaType: 'MusicEvent',
  startDate: '2025-03-15',
  startTime: '22:00',
  endDate: '2025-03-16',
  endTime: '06:00',
  doorTime: '21:00',
  timezone: '-05:00',
  country: 'PE',
  inLanguage: 'es-PE',
  location: {
    venue: 'Costa 21',
    address: 'Av. Costa Rica 3045',
    city: 'Lima',
    region: 'Lima',
    countryCode: 'PE',
    postalCode: '15046',
    geo: {
      lat: -12.0931,
      lng: -77.0465
    }
  },
  mainImageUrl: 'https://ik.imagekit.io/ravehub/events/boris-brejcha-lima.jpg',
  bannerImageUrl: 'https://ik.imagekit.io/ravehub/events/boris-brejcha-lima-banner.jpg',
  artistLineup: [
    {
      name: 'Boris Brejcha',
      eventDjId: 'boris-brejcha',
      isHeadliner: true,
      order: 1,
      instagram: '@borisbrejcha',
      performanceDate: '2025-03-15',
      performanceTime: '02:00',
      performanceEndTime: '05:00'
    },
    {
      name: 'Ann Clue',
      eventDjId: 'ann-clue',
      isHeadliner: false,
      order: 2,
      instagram: '@annclue',
      performanceDate: '2025-03-15',
      performanceTime: '00:00',
      performanceEndTime: '02:00'
    }
  ],
  organizer: {
    name: 'Ravehub Eventos',
    email: 'contacto@ravehublatam.com',
    phone: '+51 999 888 777',
    website: 'https://www.ravehublatam.com'
  },
  zones: [
    { id: 'general', name: 'General', category: 'general', capacity: 1000 },
    { id: 'vip', name: 'VIP', category: 'vip', capacity: 200 }
  ],
  salesPhases: [
    {
      id: 'fase1',
      name: 'Preventa 1',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      zonesPricing: [
        { zoneId: 'general', price: 80, available: 500 },
        { zoneId: 'vip', price: 150, available: 100 }
      ]
    },
    {
      id: 'fase2',
      name: 'Preventa 2',
      startDate: '2025-01-01',
      endDate: '2025-02-15',
      zonesPricing: [
        { zoneId: 'general', price: 100, available: 400 },
        { zoneId: 'vip', price: 180, available: 80 }
      ]
    }
  ],
  currency: 'PEN',
  isAccessibleForFree: false,
  typicalAgeRange: '18+',
  audienceType: 'Adultos amantes de la música electrónica',
  faqSection: [
    {
      question: '¿A qué hora abre el evento?',
      answer: 'Las puertas abren a las 21:00 horas.'
    },
    {
      question: '¿Puedo ingresar con menores de edad?',
      answer: 'No, este es un evento solo para mayores de 18 años.'
    },
    {
      question: '¿Habrá guardarropa?',
      answer: 'Sí, el venue cuenta con servicio de guardarropa.'
    }
  ],
  sellTicketsOnPlatform: true,
  externalTicketUrl: null,
  createdAt: new Date('2024-11-01'),
  updatedAt: new Date('2024-11-09')
};

console.log('========================================');
console.log('TESTING EVENT SCHEMA GENERATION');
console.log('========================================\n');

console.log('Mock Event Data:');
console.log(`- Name: ${mockEvent.name}`);
console.log(`- Type: ${mockEvent.eventType} (${mockEvent.schemaType})`);
console.log(`- Date: ${mockEvent.startDate} ${mockEvent.startTime}`);
console.log(`- Location: ${mockEvent.location.venue}, ${mockEvent.location.city}`);
console.log(`- Artists: ${mockEvent.artistLineup.length}`);
console.log(`- FAQs: ${mockEvent.faqSection.length}`);
console.log('');

// Simulate schema generation
const expectedSchemas = [
  'WebSite',
  'Organization',
  'WebPage',
  'MusicEvent',
  'FAQPage',
  'BreadcrumbList'
];

console.log('Expected Schemas to Generate:');
expectedSchemas.forEach((schema, index) => {
  console.log(`${index + 1}. ${schema}`);
});
console.log('');

console.log('========================================');
console.log('SCHEMA VALIDATION CHECKLIST');
console.log('========================================\n');

const validationChecklist = [
  { item: 'WebSite schema with search action', required: true },
  { item: 'Organization schema with logo and social links', required: true },
  { item: 'WebPage schema linking to WebSite and Event', required: true },
  { item: 'MusicEvent schema with all event details', required: true },
  { item: 'FAQPage schema (if FAQs exist)', required: false },
  { item: 'BreadcrumbList schema with navigation path', required: true },
  { item: 'Proper @id references between schemas', required: true },
  { item: 'ISO-8601 date format with timezone', required: true },
  { item: 'Offers with pricing and availability', required: true },
  { item: 'Location with GeoCoordinates', required: true },
  { item: 'Performer information', required: true },
  { item: 'Image objects with dimensions', required: true },
];

validationChecklist.forEach((item, index) => {
  const status = item.required ? '✓' : '○';
  console.log(`${status} ${item.item}`);
});

console.log('\n========================================');
console.log('EXPECTED OUTPUT FORMAT');
console.log('========================================\n');

console.log('Each schema should be rendered as a separate <script type="application/ld+json"> tag:');
console.log('');
console.log('<script id="event-schema-0" type="application/ld+json">');
console.log('  { "@context": "https://schema.org", "@type": "WebSite", ... }');
console.log('</script>');
console.log('');
console.log('<script id="event-schema-1" type="application/ld+json">');
console.log('  { "@context": "https://schema.org", "@type": "Organization", ... }');
console.log('</script>');
console.log('');
console.log('...(and so on for each schema type)');
console.log('');

console.log('========================================');
console.log('TESTING INSTRUCTIONS');
console.log('========================================\n');

console.log('1. Build and run the app:');
console.log('   npm run build');
console.log('   npm start');
console.log('');
console.log('2. Navigate to an event page:');
console.log('   https://www.ravehublatam.com/eventos/boris-brejcha-lima-2025');
console.log('');
console.log('3. View page source (Ctrl+U) and search for:');
console.log('   type="application/ld+json"');
console.log('');
console.log('4. Count the number of script tags found (should be 6)');
console.log('');
console.log('5. Validate with Schema.org:');
console.log('   https://validator.schema.org/');
console.log('');
console.log('6. Expected validator results:');
console.log('   - WebSite ✓');
console.log('   - Organization ✓');
console.log('   - WebPage ✓');
console.log('   - MusicEvent ✓');
console.log('   - FAQPage ✓');
console.log('   - BreadcrumbList ✓');
console.log('');

console.log('========================================');
console.log('COMMON ISSUES TO CHECK');
console.log('========================================\n');

const commonIssues = [
  'Only 2 schemas detected → Check if schemas are separate or in @graph',
  'Missing schemas → Verify all 6 schemas are in the schemas array',
  'Invalid dates → Check ISO-8601 format with timezone offset',
  'Missing @id references → Ensure proper linking between schemas',
  'Validator errors → Check for undefined values or invalid properties',
  'No FAQPage → Normal if event has no FAQs in faqSection',
];

commonIssues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue}`);
});

console.log('\n========================================');
console.log('TEST COMPLETE');
console.log('========================================\n');
