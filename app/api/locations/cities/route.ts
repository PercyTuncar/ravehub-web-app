import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const regionCode = searchParams.get('region');

  if (!countryCode) {
    return NextResponse.json(
      { error: 'Country code is required' },
      { status: 400 }
    );
  }

  try {
    // First, get the country name from REST Countries API
    const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, {
      next: { revalidate: 86400 }
    });

    if (!countryResponse.ok) {
      throw new Error('Country not found');
    }

    const countryData = await countryResponse.json();
    const countryName = countryData[0]?.name?.common;

    if (!countryName) {
      throw new Error('Country name not found');
    }

    // Using CountriesNow API for cities (free, community-driven)
    const apiResponse = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(countryName)}`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!apiResponse.ok) {
      throw new Error('Failed to fetch cities');
    }

    const data = await apiResponse.json();

    if (data.error || !data.data || !Array.isArray(data.data)) {
      const emptyResponse = NextResponse.json([]);
      emptyResponse.headers.set('X-Robots-Tag', 'noindex');
      return emptyResponse;
    }

    // Transform cities to our City format
    const cities = data.data.map((cityName: string, index: number) => ({
      id: `${countryCode}-${regionCode || 'main'}-${index}`,
      countryCode: countryCode,
      regionCode: regionCode,
      name: cityName,
      state: regionCode,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // If region is specified, filter cities that might belong to that region
    // This is a basic implementation - in production you might want more sophisticated filtering
    const filteredCities = regionCode
      ? cities.filter((city: any) => city.state === regionCode || !city.state)
      : cities;

    const response = NextResponse.json(filteredCities);
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}