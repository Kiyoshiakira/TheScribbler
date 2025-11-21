/**
 * @fileoverview Firebase service for persisting collaborative sessions
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { CollaborativeSession } from './types';

export interface SessionData {
  id: string;
  documentId: string;
  type: 'persistent' | 'live';
  createdBy: string;
  createdAt: Timestamp;
  lastModified: Timestamp;
  participants: string[];
  isActive: boolean;
  roomId: string;
  documentSnapshot?: string; // JSON stringified document state
}

export class SessionPersistenceService {
  private firestore: any;
  private userId: string;

  constructor(firestore: any, userId: string) {
    this.firestore = firestore;
    this.userId = userId;
  }

  /**
   * Create a new collaborative session
   */
  async createSession(
    sessionId: string,
    documentId: string,
    type: 'persistent' | 'live',
    roomId: string
  ): Promise<void> {
    const sessionData: Partial<SessionData> = {
      documentId,
      type,
      createdBy: this.userId,
      createdAt: serverTimestamp() as Timestamp,
      lastModified: serverTimestamp() as Timestamp,
      participants: [this.userId],
      isActive: true,
      roomId,
    };

    const sessionsRef = collection(this.firestore, 'users', this.userId, 'sessions');
    const sessionDoc = doc(sessionsRef, sessionId);
    
    await setDoc(sessionDoc, sessionData);
  }

  /**
   * Join an existing session
   */
  async joinSession(sessionId: string): Promise<SessionData | null> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );
    
    const snapshot = await getDoc(sessionDoc);
    
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as SessionData;

    // Add current user to participants if not already present
    if (!data.participants.includes(this.userId)) {
      await updateDoc(sessionDoc, {
        participants: [...data.participants, this.userId],
        lastModified: serverTimestamp(),
      });
    }

    return { ...data, id: snapshot.id };
  }

  /**
   * Update session with document snapshot
   */
  async saveDocumentSnapshot(
    sessionId: string,
    documentSnapshot: string
  ): Promise<void> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );

    await updateDoc(sessionDoc, {
      documentSnapshot,
      lastModified: serverTimestamp(),
    });
  }

  /**
   * Get document snapshot from session
   */
  async getDocumentSnapshot(sessionId: string): Promise<string | null> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );

    const snapshot = await getDoc(sessionDoc);
    
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data()?.documentSnapshot || null;
  }

  /**
   * End a collaborative session
   */
  async endSession(sessionId: string): Promise<void> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );

    await updateDoc(sessionDoc, {
      isActive: false,
      lastModified: serverTimestamp(),
    });
  }

  /**
   * Get all active sessions for current user
   */
  async getActiveSessions(): Promise<SessionData[]> {
    const sessionsRef = collection(this.firestore, 'users', this.userId, 'sessions');
    const q = query(sessionsRef, where('isActive', '==', true));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as SessionData[];
  }

  /**
   * Remove participant from session
   */
  async leaveSession(sessionId: string): Promise<void> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );

    const snapshot = await getDoc(sessionDoc);
    
    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.data() as SessionData;
    const updatedParticipants = data.participants.filter(
      (id) => id !== this.userId
    );

    await updateDoc(sessionDoc, {
      participants: updatedParticipants,
      lastModified: serverTimestamp(),
      // If no participants left, mark as inactive
      isActive: updatedParticipants.length > 0,
    });
  }

  /**
   * Update session activity timestamp
   */
  async updateActivity(sessionId: string): Promise<void> {
    const sessionDoc = doc(
      this.firestore,
      'users',
      this.userId,
      'sessions',
      sessionId
    );

    await updateDoc(sessionDoc, {
      lastModified: serverTimestamp(),
    });
  }
}
