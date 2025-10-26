import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import Document from '@/lib/db/models/Document';
import { categoryFromFilename } from '@/lib/uploads/validation';

const completeUploadSchema = z.object({
  files: z.array(z.object({
    s3Key: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    byteSize: z.number().positive(),
  })).min(1),
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
    const { files } = completeUploadSchema.parse(body);

    await connectDB();

    const documents = [];

    for (const file of files) {
      // Infer category from filename
      const category = categoryFromFilename(file.originalName);
      if (!category) {
        return NextResponse.json(
          { error: `Unable to determine category for file: ${file.originalName}` },
          { status: 400 }
        );
      }

      // Create document record
      const document = new Document({
        userId: session.user.id,
        originalName: file.originalName,
        s3Key: file.s3Key,
        mimeType: file.mimeType,
        byteSize: file.byteSize,
        status: 'uploaded',
        category,
      });

      await document.save();
      documents.push(document);
    }

    // TODO: Enqueue document processing job
    // This is where you'd add the document to a job queue for AI analysis

    return NextResponse.json({ ok: true, documents: documents.length });

  } catch (error) {
    console.error('Error completing upload:', error);
    
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
