import { NextRequest, NextResponse } from 'next/server';
import { eventDjsCollection } from '@/lib/firebase/collections';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';

    // Build conditions
    const conditions: Array<{ field: string; operator: any; value: any }> = [
      { field: 'approved', operator: '==', value: true }
    ];

    if (country && country !== 'all') {
      conditions.push({ field: 'country', operator: '==', value: country });
    }

    // For search, we'll need to filter on the client side since Firestore doesn't support
    // full-text search efficiently. We'll fetch more and filter.
    const fetchSize = search ? pageSize * 3 : pageSize;

    // Determine sort field
    let orderField = 'name';
    let orderDirection: 'asc' | 'desc' = 'asc';

    if (sortBy === 'country') {
      orderField = 'country';
    } else if (sortBy === 'upcoming-events') {
      orderField = 'upcomingEventsCount';
      orderDirection = 'desc';
    }

    // Get paginated data
    const skip = (page - 1) * fetchSize;

    // Since we need to skip, we'll fetch all approved DJs and do client-side pagination
    // This is not ideal but Firestore doesn't support offset-based pagination well
    const allDjs = await eventDjsCollection.query(
      conditions,
      orderField,
      orderDirection,
      skip + fetchSize
    );

    // Apply client-side search filter if needed
    let filteredDjs = allDjs;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDjs = allDjs.filter(dj =>
        dj.name.toLowerCase().includes(searchLower) ||
        dj.country.toLowerCase().includes(searchLower) ||
        dj.genres?.some((genre: string) => genre.toLowerCase().includes(searchLower))
      );
    }

    // Paginate the results
    const startIndex = skip;
    const endIndex = startIndex + pageSize;
    const paginatedDjs = filteredDjs.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredDjs.length;

    return NextResponse.json({
      djs: paginatedDjs,
      hasMore,
      page,
      totalResults: filteredDjs.length,
    });
  } catch (error) {
    console.error('Error fetching DJs:', error);
    return NextResponse.json(
      { error: 'Error fetching DJs' },
      { status: 500 }
    );
  }
}
