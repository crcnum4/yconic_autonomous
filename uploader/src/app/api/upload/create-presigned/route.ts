import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import { validateFile } from '@/lib/uploads/validation';
import { generatePresignedPutUrl, generateS3Key } from '@/lib/s3/presign';
import { rateLimiter } from '@/lib/utils/rateLimit';

const createPresignedSchema = z.object({
  files: z.array(z.object({
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    byteSize: z.number().min(0), // Allow 0 byte files
  })).min(1).max(10), // Limit to 10 files per request
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const clientId = session.user.id;
    if (!rateLimiter.isAllowed(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { files } = createPresignedSchema.parse(body);

    await connectDB();

    const results = [];

    for (const file of files) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Generate S3 key
      const s3Key = generateS3Key(session.user.id, file.originalName);

      // Generate presigned URL
      const presignedUrl = await generatePresignedPutUrl(s3Key, file.mimeType);

      results.push({
        s3Key,
        category: validation.category,
        presignedUrl,
        originalName: file.originalName,
        mimeType: file.mimeType,
        byteSize: file.byteSize,
      });
    }

    return NextResponse.json({ ok: true, results });

  } catch (error) {
    console.error('Error creating presigned URLs:', error);
    
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
