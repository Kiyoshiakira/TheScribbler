/**
 * Utility for verifying Firebase ID tokens in API routes
 */

import { NextRequest } from 'next/server';

export interface VerifiedUser {
  uid: string;
  email?: string;
}

/**
 * Verify a Firebase ID token using the Firebase REST API
 */
export async function verifyIdToken(token: string): Promise<VerifiedUser> {
  try {
    // Use Firebase REST API to verify the token
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: token,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json();
    
    if (!data.users || data.users.length === 0) {
      throw new Error('User not found');
    }

    const user = data.users[0];
    
    return {
      uid: user.localId,
      email: user.email,
    };
  } catch (error) {
    throw new Error('Token verification failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Extract and verify the Bearer token from the Authorization header
 */
export async function verifyAuthHeader(request: NextRequest): Promise<VerifiedUser> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/);
  
  if (!match) {
    throw new Error('Invalid Authorization header format');
  }

  const token = match[1];
  return verifyIdToken(token);
}
