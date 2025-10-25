import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Using REST Countries API (free, no key required)
    const apiResponse = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,capital,currencies,languages,flags,population,timezones', {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!apiResponse.ok) {
      throw new Error('Failed to fetch countries');
    }

    const countries = await apiResponse.json();

    // Transform to our format
    const transformedCountries = countries.map((country: any) => ({
      id: country.cca2,
      code: country.cca2,
      name: country.name.common,
      nativeName: country.name.nativeName ? Object.values(country.name.nativeName)[0] : country.name.common,
      region: country.region,
      subregion: country.subregion,
      capital: country.capital?.[0],
      currencies: country.currencies ? Object.entries(country.currencies).map(([code, data]: [string, any]) => ({
        code,
        name: data.name,
        symbol: data.symbol
      })) : [],
      languages: country.languages ? Object.entries(country.languages).map(([code, name]: [string, any]) => ({
        iso639_1: code,
        iso639_2: code,
        name: name,
        nativeName: name
      })) : [],
      flag: country.flags.svg,
      population: country.population,
      timezones: country.timezones || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const response = NextResponse.json(transformedCountries);
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}