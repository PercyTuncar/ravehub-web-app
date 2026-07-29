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
    const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, {
      next: { revalidate: 86400 }
    });

    if (!countryResponse.ok) {
      throw new Error('Country not found');
    }

    const countryData = await countryResponse.json();
    const timezone = countryData[0]?.timezones?.[0];

    if (!timezone) {
      throw new Error('Timezone not found');
    }

    const response = NextResponse.json({ timezone });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error fetching timezone:', error);

    // Fallback to static data
    try {
      const { getStaticTimezone } = await import('@/lib/data/locations');
      const staticTimezone = getStaticTimezone(countryCode);

      if (staticTimezone) {
        return NextResponse.json({ timezone: staticTimezone });
      }
    } catch (fallbackError) {
      console.error('Error loading static timezone:', fallbackError);
    }

    return NextResponse.json(
      { error: 'Failed to fetch timezone' },
      { status: 500 }
    );
  }
}
