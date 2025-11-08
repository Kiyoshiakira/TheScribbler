/**
 * Firestore utility functions
 * 
 * Helper functions for working with Firestore documents
 */

/**
 * Removes undefined values from an object to avoid Firestore errors.
 * Firestore rejects documents with undefined field values.
 * 
 * Note: This performs shallow cleaning. Nested objects with undefined values
 * are not recursively cleaned. For the Notes use case, all fields are at the
 * top level, so this is sufficient.
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
