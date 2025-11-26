/**
 * Admin User Management Utility
 *
 * This module provides centralized admin user detection for The Scribbler app.
 * Admins receive unlimited access to all features, including:
 * - All paid features and tiers (Mentor/Master tier)
 * - Unlimited collaboration, AI, and mentor marketplace access
 * - All export options and tools
 * - All future functionalities without restrictions
 *
 * HOW TO ADD NEW ADMIN USERS:
 * Simply add the user's email address to the ADMIN_EMAILS array below.
 * The email check is case-insensitive for convenience.
 *
 * @example
 * // To add a new admin, just add their email:
 * const ADMIN_EMAILS: string[] = [
 *   'shaunessy24@gmail.com',
 *   'newadmin@example.com',  // <-- Add new admin emails here
 * ];
 */

/**
 * List of admin email addresses.
 * Users with these emails will have unlimited access to all features.
 * Email matching is case-insensitive.
 * 
 * SECURITY NOTE: This list is kept private and only the isAdmin function
 * is exported to prevent leaking admin email addresses.
 */
const ADMIN_EMAILS: string[] = [
  'shaunessy24@gmail.com',
  // Add additional admin emails below this line
];

/**
 * Checks if a user email belongs to an admin user.
 *
 * @param email - The user's email address to check
 * @returns true if the email belongs to an admin user, false otherwise
 *
 * @example
 * ```ts
 * import { isAdmin } from '@/lib/admin';
 *
 * const userIsAdmin = isAdmin(user?.email);
 * if (userIsAdmin) {
 *   // Grant full access
 * }
 * ```
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  // Case-insensitive comparison for convenience
  const normalizedEmail = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase().trim() === normalizedEmail
  );
}
