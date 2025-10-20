import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');

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

    // Using CountriesNow API for states (free, community-driven)
    const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states/q?country=${encodeURIComponent(countryName)}`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error('Failed to fetch regions');
    }

    const data = await response.json();

    if (data.error || !data.data || !data.data.states) {
      // Fallback: try to get regions from REST Countries
      const regions = [{
        id: `${countryCode}-main`,
        countryCode: countryCode,
        code: countryCode,
        name: countryData[0].subregion || countryData[0].region,
        type: 'region',
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      return NextResponse.json(regions);
    }

    // Transform states to our Region format
    const regions = data.data.states.map((state: any, index: number) => ({
      id: `${countryCode}-${state.state_code || index}`,
      countryCode: countryCode,
      code: state.state_code || `${countryCode}-${index}`,
      name: state.name,
      type: 'state',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return NextResponse.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}