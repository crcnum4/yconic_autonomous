import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import connectDB from '@/lib/db/connect';
import Document from '@/lib/db/models/Document';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');

    await connectDB();

    // Build query
    const query: any = {
      userId: session.user.id,
      deletedAt: null,
    };

    // Add cursor for pagination
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch documents
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get next cursor
    const nextCursor = documents.length === limit 
      ? documents[documents.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      ok: true,
      documents,
      nextCursor,
      hasMore: documents.length === limit,
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
