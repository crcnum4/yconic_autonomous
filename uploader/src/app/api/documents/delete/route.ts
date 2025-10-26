import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import Document from '@/lib/db/models/Document';

const deleteDocumentSchema = z.object({
  id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { id } = deleteDocumentSchema.parse(body);

    await connectDB();

    // Find and soft delete the document
    const document = await Document.findOneAndUpdate(
      { 
        _id: id, 
        userId: session.user.id,
        deletedAt: null 
      },
      { 
        deletedAt: new Date() 
      },
      { new: true }
    );

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // TODO: Optionally delete from S3 if DELETE_FROM_S3 env var is set
    // This would require additional S3 delete logic

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error deleting document:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
