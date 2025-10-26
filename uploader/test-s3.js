// Test script to verify S3 presigned URL generation
import { generatePresignedPutUrl, generateS3Key } from './src/lib/s3/presign.js';

async function testPresignedUrl() {
  try {
    const userId = 'test-user-123';
    const fileName = 'test-file.txt';
    const contentType = 'text/plain';
    
    const s3Key = generateS3Key(userId, fileName);
    console.log('Generated S3 key:', s3Key);
    
    const presignedUrl = await generatePresignedPutUrl(s3Key, contentType);
    console.log('Presigned URL:', presignedUrl);
    
    // Test the URL with a simple PUT request
    const testData = 'Hello, S3!';
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: testData,
      headers: {
        'Content-Type': contentType,
      },
    });
    
    console.log('Test upload response:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ S3 upload test successful!');
    } else {
      console.log('❌ S3 upload test failed');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPresignedUrl();
