/**
 * Shared utilities for template storage (localStorage)
 */

import { Template } from '@/data/templates';

/**
 * Local storage key for custom templates
 */
export const CUSTOM_TEMPLATES_STORAGE_KEY = 'scribbler-custom-templates';

/**
 * Load custom templates from local storage
 */
export function loadLocalTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates from local storage:', error);
    return [];
  }
}

/**
 * Save custom templates to local storage
 */
export function saveLocalTemplates(templates: Template[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates to local storage:', error);
  }
}

/**
 * Check if a template is stored locally (vs cloud/Firestore)
 * Uses ID prefix to determine storage location
 */
export function isLocalTemplate(template: Template): boolean {
  return template.id.startsWith('local-') || template.id.startsWith('custom-local-');
}

/**
 * Deduplicate templates by ID, preferring cloud templates over local ones
 */
export function deduplicateTemplates(templates: Template[]): Template[] {
  const seenIds = new Set<string>();
  const deduplicated: Template[] = [];

  // Process in reverse order so cloud templates (added later) take precedence
  for (let i = templates.length - 1; i >= 0; i--) {
    const template = templates[i];
    if (!seenIds.has(template.id)) {
      seenIds.add(template.id);
      deduplicated.unshift(template);
    }
  }

  return deduplicated;
}
