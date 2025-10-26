import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    // Optional: Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Call Python backend
    const response = await fetch(`${PYTHON_API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to get response from mentor' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      question: data.question,
      answer: data.answer,
      sources: data.sources,
    });
  } catch (error) {
    console.error('Error calling mentor API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
