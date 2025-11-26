/**
 * API Route: /api/google-docs/create
 * 
 * Server-side proxy for creating Google Docs
 * This avoids CORS issues and keeps API calls secure
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing access token' },
        { status: 401 }
      );
    }

    // Create the Google Doc via server-side request
    const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title || 'Untitled Screenplay',
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return NextResponse.json(
        { success: false, error: `Failed to create Google Doc: ${errorText}` },
        { status: createResponse.status }
      );
    }

    const createData = await createResponse.json();

    return NextResponse.json({
      success: true,
      documentId: createData.documentId,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
