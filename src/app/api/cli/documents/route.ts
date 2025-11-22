/**
 * API Route: /api/cli/documents
 * 
 * List all documents for the authenticated user (GET)
 * Create a new document (POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/verify-token';

const FIRESTORE_API_URL = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthHeader(request);

    // Get the ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // List documents using Firestore REST API
    const response = await fetch(
      `${FIRESTORE_API_URL}/users/${user.uid}/scripts`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch documents',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Define Firestore document type
    interface FirestoreDocument {
      name: string;
      fields?: {
        title?: { stringValue?: string };
        content?: { stringValue?: string };
        logline?: { stringValue?: string };
        authorId?: { stringValue?: string };
        createdAt?: { timestampValue?: string };
        lastModified?: { timestampValue?: string };
        updatedAt?: { timestampValue?: string };
      };
    }
    
    // Transform Firestore REST API response to our format
    const documents = (data.documents || []).map((doc: FirestoreDocument) => {
      const id = doc.name.split('/').pop();
      const fields = doc.fields || {};
      
      return {
        id,
        title: fields.title?.stringValue || '',
        content: fields.content?.stringValue || '',
        logline: fields.logline?.stringValue || '',
        authorId: fields.authorId?.stringValue || '',
        createdAt: fields.createdAt?.timestampValue || null,
        lastModified: fields.lastModified?.timestampValue || fields.updatedAt?.timestampValue || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('List documents error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list documents',
      },
      { status: error instanceof Error && error.message.includes('Authorization') ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthHeader(request);
    const body = await request.json();
    const { title, content = '', logline = '' } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing title' },
        { status: 400 }
      );
    }

    // Get the ID token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Generate a document ID
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create document using Firestore REST API
    const firestoreDoc = {
      fields: {
        title: { stringValue: title },
        content: { stringValue: content },
        logline: { stringValue: logline },
        authorId: { stringValue: user.uid },
        createdAt: { timestampValue: new Date().toISOString() },
        lastModified: { timestampValue: new Date().toISOString() },
      },
    };

    const response = await fetch(
      `${FIRESTORE_API_URL}/users/${user.uid}/scripts?documentId=${docId}`,
      {
        method: 'POST',
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
        {
          success: false,
          error: 'Failed to create document',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const fields = data.fields || {};

    return NextResponse.json({
      success: true,
      data: {
        id: docId,
        title: fields.title?.stringValue || title,
        content: fields.content?.stringValue || content,
        logline: fields.logline?.stringValue || logline,
        authorId: fields.authorId?.stringValue || user.uid,
        createdAt: fields.createdAt?.timestampValue || new Date().toISOString(),
        lastModified: fields.lastModified?.timestampValue || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Create document error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create document',
      },
      { status: error instanceof Error && error.message.includes('Authorization') ? 401 : 500 }
    );
  }
}
