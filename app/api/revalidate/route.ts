import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Secret token for security (should match NEXTAUTH_SECRET or a custom env var)
const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN || 'your-secret-token';

export async function POST(request: NextRequest) {
  try {
    const { token, path, tag } = await request.json();

    // Verify token
    if (token !== REVALIDATE_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (path) {
      // Revalidate specific path
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        path,
        message: `Revalidated path: ${path}`
      });
    }

    if (tag) {
      // Revalidate by tag
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        tag,
        message: `Revalidated tag: ${tag}`
      });
    }

    return NextResponse.json(
      { error: 'Either path or tag must be provided' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for simple revalidation (less secure, use POST for production)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  if (token !== REVALIDATE_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  if (path) {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      message: `Revalidated path: ${path}`
    });
  }

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({
      revalidated: true,
      tag,
      message: `Revalidated tag: ${tag}`
    });
  }

  return NextResponse.json(
    { error: 'Either path or tag must be provided' },
    { status: 400 }
  );
}