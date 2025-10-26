import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const generatePresignedPutUrl = async (
  s3Key: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: s3Key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const generateS3Key = (userId: string, originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const slugifiedName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `user/${userId}/${timestamp}-${random}-${slugifiedName}`;
};
