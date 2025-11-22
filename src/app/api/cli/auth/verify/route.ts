/**
 * API Route: /api/cli/auth/verify
 * 
 * Verifies a Firebase ID token for CLI authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/verify-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 401 }
      );
    }

    // Verify the Firebase ID token
    const user = await verifyIdToken(token);
    
    return NextResponse.json({
      success: true,
      data: {
        userId: user.uid,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      },
      { status: 401 }
    );
  }
}
