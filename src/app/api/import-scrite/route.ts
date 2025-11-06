/**
 * API Route: /api/import-scrite
 * 
 * Accepts a POST request with a base64-encoded .scrite file
 * Returns the parsed header JSON and Fountain text conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { importScriteFile } from '@/lib/scriteImporter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, content } = body;

    if (!filename || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing filename or content in request body' },
        { status: 400 }
      );
    }

    // Decode base64 content to ArrayBuffer
    const base64Data = content.split(',')[1] || content; // Handle data URL or raw base64
    let binaryString;
    try {
      binaryString = atob(base64Data);
    } catch (decodeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid base64 content: ${decodeError instanceof Error ? decodeError.message : 'Could not decode file'}` 
        },
        { status: 400 }
      );
    }
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    // Import and convert the file
    const result = await importScriteFile(arrayBuffer);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      header: result.headerJson,
      fountain: result.fountainText,
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
