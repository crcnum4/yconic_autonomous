import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';

export async function GET(req: NextRequest) {
  try {
    // Check MongoDB connection
    await connectDB();
    
    // Basic health check response
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 503 }
    );
  }
}
