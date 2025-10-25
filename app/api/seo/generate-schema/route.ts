import { NextRequest, NextResponse } from 'next/server';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import { blogCollection, eventsCollection } from '@/lib/firebase/collections';

export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400 }
      );
    }

    let data: any = null;

    // Fetch data based on type
    if (type === 'blog' || type === 'news') {
      const posts = await blogCollection.query(
        [{ field: 'id', operator: '==', value: id }]
      );
      if (posts.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      data = posts[0];
    } else if (type === 'festival' || type === 'concert') {
      const events = await eventsCollection.query(
        [{ field: 'id', operator: '==', value: id }]
      );
      if (events.length === 0) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      data = events[0];
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Supported types: blog, news, festival, concert' },
        { status: 400 }
      );
    }

    // Generate schema based on type
    const schema = SchemaGenerator.generate({
      type: type as 'blog' | 'news' | 'festival' | 'concert',
      data,
    });

    const response = NextResponse.json({ schema });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error generating schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json(
      { error: 'Missing required query parameters: type and id' },
      { status: 400 }
    );
  }

  try {
    let data: any = null;

    // Fetch data based on type
    if (type === 'blog' || type === 'news') {
      const posts = await blogCollection.query(
        [{ field: 'id', operator: '==', value: id }]
      );
      if (posts.length === 0) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
      data = posts[0];
    } else if (type === 'festival' || type === 'concert') {
      const events = await eventsCollection.query(
        [{ field: 'id', operator: '==', value: id }]
      );
      if (events.length === 0) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
      data = events[0];
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Supported types: blog, news, festival, concert' },
        { status: 400 }
      );
    }

    // Generate schema based on type
    const schema = SchemaGenerator.generate({
      type: type as 'blog' | 'news' | 'festival' | 'concert',
      data,
    });

    const response = NextResponse.json({ schema });
    response.headers.set('X-Robots-Tag', 'noindex');
    return response;
  } catch (error) {
    console.error('Error generating schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}