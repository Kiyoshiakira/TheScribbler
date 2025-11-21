/**
 * @fileoverview Utilities for generating user colors and avatars
 */

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

/**
 * Generate a consistent color for a user based on their ID
 */
export function getUserColor(userId: string): string {
  // Simple hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % PRESET_COLORS.length;
  return PRESET_COLORS[index];
}

/**
 * Get user initials from name
 */
export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a random room ID for collaborative sessions
 */
export function generateRoomId(): string {
  return `collab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a timestamp is recent (within last 30 seconds)
 */
export function isRecentActivity(timestamp: number): boolean {
  return Date.now() - timestamp < 30000;
}
