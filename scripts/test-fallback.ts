
import { getStaticRegions, getStaticCities } from '@/lib/data/locations';

async function testFallback() {
    const countryCode = 'PE';
    console.log('--- Testing Static Fallback Data for PE ---');

    const regions = getStaticRegions(countryCode);
    console.log(`Regions found: ${regions.length}`);
    if (regions.length > 0) {
        console.log('First 3 regions:', regions.slice(0, 3));
    } else {
        console.error('No regions found in static data!');
    }

    const cities = getStaticCities(countryCode, 'Lima');
    console.log(`Cities in Lima found: ${cities.length}`);
    if (cities.length > 0) {
        console.log('First 3 cities:', cities.slice(0, 3));
    } else {
        console.error('No cities found in static data for Lima!');
    }

    const allCities = getStaticCities(countryCode);
    console.log(`Total cities found (no region): ${allCities.length}`);
}

testFallback();
