import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to clear conversation' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
