
async function testApis() {
    const countryCode = 'PE';

    console.log('--- Testing REST Countries API ---');
    try {
        const t0 = performance.now();
        const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const t1 = performance.now();
        console.log(`Status: ${countryResponse.status}`);
        console.log(`Time: ${(t1 - t0).toFixed(2)}ms`);

        if (countryResponse.ok) {
            const countryData = await countryResponse.json();
            const countryName = countryData[0]?.name?.common;
            console.log(`Country Name: ${countryName}`);

            if (countryName) {
                console.log('\n--- Testing CountriesNow Regions API ---');
                const t2 = performance.now();
                const regionsResponse = await fetch(`https://countriesnow.space/api/v0.1/countries/states/q?country=${encodeURIComponent(countryName)}`);
                const t3 = performance.now();
                console.log(`Status: ${regionsResponse.status}`);
                console.log(`Time: ${(t3 - t2).toFixed(2)}ms`);

                if (regionsResponse.ok) {
                    const regionsData = await regionsResponse.json();
                    console.log(`Regions found: ${regionsData.data?.states?.length || 0}`);
                } else {
                    console.error('Regions API failed:', await regionsResponse.text());
                }

                console.log('\n--- Testing CountriesNow Cities API ---');
                const t4 = performance.now();
                const citiesResponse = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(countryName)}`);
                const t5 = performance.now();
                console.log(`Status: ${citiesResponse.status}`);
                console.log(`Time: ${(t5 - t4).toFixed(2)}ms`);

                if (citiesResponse.ok) {
                    const citiesData = await citiesResponse.json();
                    console.log(`Cities found: ${citiesData.data?.length || 0}`);
                } else {
                    console.error('Cities API failed:', await citiesResponse.text());
                }
            }
        } else {
            console.error('REST Countries API failed:', await countryResponse.text());
        }
    } catch (error) {
        console.error('Error testing APIs:', error);
    }
}

testApis();
