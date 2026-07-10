import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getAuthenticatedUser } from '@/lib/auth';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.SPACES_URL,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.SPACES_BUCKET || 'alphatrader';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { key } = await params;
    if (!key || key.length === 0) {
      return new Response('File not found', { status: 404 });
    }

    const fullKey = key.join('/');
    
    // Security check: ensure user only accesses their own uploaded files (key starts with user's ID)
    if (!fullKey.startsWith(`${sessionUser.userId}/`)) {
      return new Response('Forbidden', { status: 403 });
    }

    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fullKey,
      })
    );

    if (!s3Response.Body) {
      return new Response('File not found', { status: 404 });
    }

    // Convert SdkStream to standard Web ReadableStream for perfect Route Handler compatibility
    const webStream = (s3Response.Body as any).transformToWebStream();

    return new Response(webStream, {
      headers: {
        'Content-Type': s3Response.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error fetching file from R2:', error);
    if (error.name === 'NoSuchKey') {
      return new Response('File not found', { status: 404 });
    }
    return new Response('Failed to retrieve file', { status: 500 });
  }
}
