const fs = require('fs');

const djData = {
    name: 'Boris Brejcha',
    description: 'Productor alemán referente del high-tech minimal; fundador del sello Fckng Serious. Escucha sus últimos tracks y noticias en Ravehub.',
    country: 'Alemania'
};

const upcomingEvents = [
    { location: { city: 'Lima' }, startDate: '2025-05-20' },
    { location: { city: 'Santiago' }, startDate: '2025-05-22' },
    { location: { city: 'Bogotá' }, startDate: '2025-05-25' }
];

function generateDescription(djData, validUpcomingEvents) {
    const baseBio = djData.description || 'Perfil de ' + djData.name;
    let description = baseBio;

    if (validUpcomingEvents.length > 0) {
        const cities = Array.from(new Set(
            validUpcomingEvents
                .map(e => e.location?.city)
                .filter(Boolean)
        ));

        const listFormatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
        const cityList = listFormatter.format(cities);

        const nearestEventDate = new Date(validUpcomingEvents[0].startDate);
        const year = nearestEventDate.getFullYear();

        const prefix = `${djData.name} en ${cityList}. Tickets y fechas confirmadas para el tour ${year}. `;

        const maxTotalLength = 155;
        const availableSpace = maxTotalLength - prefix.length;

        if (availableSpace > 10) {
            let truncatedBio = baseBio.replace(/\s+/g, ' ').trim();
            if (truncatedBio.length > availableSpace) {
                truncatedBio = truncatedBio.substring(0, availableSpace - 3).trim() + '...';
            }
            description = `${prefix}${truncatedBio}`;
        } else {
            description = prefix.trim();
        }
    } else {
        description = baseBio.replace(/\s+/g, ' ').trim();
        if (description.length > 155) {
            description = description.substring(0, 152).trim() + '...';
        }
    }
    return description;
}

let output = '';
const log = (msg) => { output += msg + '\n'; };

log('--- Test Case 1: 3 Cities ---');
log(generateDescription(djData, upcomingEvents));

log('\n--- Test Case 2: 2 Cities ---');
log(generateDescription(djData, upcomingEvents.slice(0, 2)));

log('\n--- Test Case 3: 1 City ---');
log(generateDescription(djData, upcomingEvents.slice(0, 1)));

log('\n--- Test Case 4: No Events ---');
log(generateDescription(djData, []));

log('\n--- Test Case 5: Duplicate Cities ---');
log(generateDescription(djData, [
    { location: { city: 'Lima' }, startDate: '2025-05-20' },
    { location: { city: 'Lima' }, startDate: '2025-05-22' }
]));

fs.writeFileSync('output_test.txt', output, 'utf8');
