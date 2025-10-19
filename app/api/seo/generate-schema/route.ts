import { NextRequest, NextResponse } from 'next/server';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import { blogCollection } from '@/lib/firebase/collections';

export async function POST(request: NextRequest) {
  try {
    const { type, postId } = await request.json();

    if (!type || !postId) {
      return NextResponse.json(
        { error: 'Missing required fields: type and postId' },
        { status: 400 }
      );
    }

    // Fetch the post data
    const posts = await blogCollection.query(
      [{ field: 'id', operator: '==', value: postId }]
    );

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0] as any;

    // Generate schema based on type
    const schema = SchemaGenerator.generate({
      type: type as 'blog' | 'news' | 'festival' | 'concert',
      data: post,
    });

    return NextResponse.json({ schema });
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
  const postId = searchParams.get('postId');

  if (!type || !postId) {
    return NextResponse.json(
      { error: 'Missing required query parameters: type and postId' },
      { status: 400 }
    );
  }

  try {
    // Fetch the post data
    const posts = await blogCollection.query(
      [{ field: 'id', operator: '==', value: postId }]
    );

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0] as any;

    // Generate schema based on type
    const schema = SchemaGenerator.generate({
      type: type as 'blog' | 'news' | 'festival' | 'concert',
      data: post,
    });

    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Error generating schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}