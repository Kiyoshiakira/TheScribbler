/**
 * Firestore utility functions
 * 
 * Helper functions for working with Firestore documents
 */

/**
 * Removes undefined values from an object to avoid Firestore errors.
 * Firestore rejects documents with undefined field values.
 * 
 * @param obj - Object to clean
 * @returns New object with undefined values removed
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  
  return cleaned as Partial<T>;
}
