/**
 * API Route: /api/google-docs/update
 * 
 * Server-side proxy for updating Google Docs
 * This avoids CORS issues and keeps API calls secure
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, requests, accessToken } = body;

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

    // Update the Google Doc via server-side request
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return NextResponse.json(
        { success: false, error: `Failed to update Google Doc: ${errorText}` },
        { status: updateResponse.status }
      );
    }

    const updateData = await updateResponse.json();

    return NextResponse.json({
      success: true,
      data: updateData,
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
