/**
 * API Route: /api/cli/documents/[documentId]
 * 
 * Get a specific document (GET)
 * Update a document (PATCH)
 * Delete a document (DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/verify-token';

const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyAuthHeader(request);
    const { documentId } = params;

    // Get the ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Get document using Firestore REST API
    const response = await fetch(
      `${FIRESTORE_API_URL}/users/${user.uid}/scripts/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
      
      const error = await response.text();
      console.error('Firestore API error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch document' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fields = data.fields || {};

    const document = {
      id: documentId,
      title: fields.title?.stringValue || '',
      content: fields.content?.stringValue || '',
      logline: fields.logline?.stringValue || '',
      authorId: fields.authorId?.stringValue || '',
      createdAt: fields.createdAt?.timestampValue || null,
      lastModified: fields.lastModified?.timestampValue || fields.updatedAt?.timestampValue || null,
    };

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Get document error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document',
      },
      { status: error instanceof Error && error.message.includes('Authorization') ? 401 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyAuthHeader(request);
    const { documentId } = params;
    const body = await request.json();

    // Get the ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Build the update mask and fields
    interface FirestoreField {
      stringValue?: string;
      timestampValue?: string;
    }
    const updateFields: Record<string, FirestoreField> = {};
    const fieldMask: string[] = [];

    if (body.title !== undefined) {
      updateFields.title = { stringValue: body.title };
      fieldMask.push('title');
    }
    if (body.content !== undefined) {
      updateFields.content = { stringValue: body.content };
      fieldMask.push('content');
    }
    if (body.logline !== undefined) {
      updateFields.logline = { stringValue: body.logline };
      fieldMask.push('logline');
    }
    
    // Always update lastModified
    updateFields.lastModified = { timestampValue: new Date().toISOString() };
    fieldMask.push('lastModified');

    // Update document using Firestore REST API
    const firestoreDoc = {
      fields: updateFields,
    };

    const updateMask = fieldMask.map(f => `updateMask.fieldPaths=${f}`).join('&');
    const response = await fetch(
      `${FIRESTORE_API_URL}/users/${user.uid}/scripts/${documentId}?${updateMask}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreDoc),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore API error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fields = data.fields || {};

    return NextResponse.json({
      success: true,
      data: {
        id: documentId,
        title: fields.title?.stringValue || '',
        content: fields.content?.stringValue || '',
        logline: fields.logline?.stringValue || '',
        authorId: fields.authorId?.stringValue || user.uid,
        createdAt: fields.createdAt?.timestampValue || null,
        lastModified: fields.lastModified?.timestampValue || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update document error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document',
      },
      { status: error instanceof Error && error.message.includes('Authorization') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await verifyAuthHeader(request);
    const { documentId } = params;

    // Get the ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Delete document using Firestore REST API
    const response = await fetch(
      `${FIRESTORE_API_URL}/users/${user.uid}/scripts/${documentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore API error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete document error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      },
      { status: error instanceof Error && error.message.includes('Authorization') ? 401 : 500 }
    );
  }
}
