import { NextRequest, NextResponse } from 'next/server';
import { SchemaGenerator } from '@/lib/seo/schema-generator';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    // Generate schema based on type
    const schema = SchemaGenerator.generate({
      type: type as 'blog' | 'news' | 'festival' | 'concert',
      data,
    });

    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Error generating schema preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}