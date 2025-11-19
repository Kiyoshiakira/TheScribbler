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

/**
 * Recursively removes all fields with undefined values from an object.
 * Firestore does not accept undefined values - fields must be null, a value, or omitted.
 * 
 * This is the deep-cleaning version that handles nested objects.
 * 
 * @param obj - The object to sanitize
 * @returns A new object with all undefined values removed (including in nested objects)
 * 
 * @example
 * const data = { title: "Script", logline: undefined, nested: { field: undefined, value: "ok" } };
 * const sanitized = sanitizeFirestorePayload(data);
 * // Result: { title: "Script", nested: { value: "ok" } }
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const sanitized: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      // Skip undefined values entirely
      if (value === undefined) {
        continue;
      }
      
      // Recursively sanitize nested plain objects (but not arrays or special types)
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
        sanitized[key] = sanitizeFirestorePayload(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized as Partial<T>;
}
