import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const csrfToken = request.cookies.get('csrfToken')?.value;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/critique/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'CSRF-Token': csrfToken || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to get critique summary' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting critique summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
