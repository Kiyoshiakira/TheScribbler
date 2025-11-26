/**
 * API Route: /api/google-docs/get
 * 
 * Server-side proxy for fetching Google Docs content
 * This avoids CORS issues and keeps API calls secure
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing access token' },
        { status: 401 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing document ID' },
        { status: 400 }
      );
    }

    // Fetch the Google Doc via server-side request
    const getResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      return NextResponse.json(
        { success: false, error: `Failed to fetch Google Doc: ${errorText}` },
        { status: getResponse.status }
      );
    }

    const documentData = await getResponse.json();

    return NextResponse.json({
      success: true,
      document: documentData,
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
