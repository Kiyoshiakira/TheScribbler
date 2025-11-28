/**
 * Project utility functions for managing Script/Story project types
 * 
 * Helper functions for normalizing project types and ensuring
 * consistent project creation across the application.
 */

/**
 * Project type definition - either 'script' or 'story'
 */
export type ProjectType = 'script' | 'story';

/**
 * Normalizes the project type from a document, defaulting to 'script'
 * for backwards compatibility with existing documents that don't have
 * a projectType field.
 * 
 * @param doc - The document object that may contain a projectType field
 * @returns 'script' or 'story', defaulting to 'script' if not specified
 * 
 * @example
 * // Document with projectType
 * normalizeProjectType({ projectType: 'story' }) // Returns 'story'
 * 
 * // Document without projectType (legacy document)
 * normalizeProjectType({ title: 'My Script' }) // Returns 'script'
 * 
 * // Null/undefined document
 * normalizeProjectType(null) // Returns 'script'
 */
export function normalizeProjectType(doc: { projectType?: string } | null | undefined): ProjectType {
  if (!doc || !doc.projectType) {
    return 'script';
  }
  
  // Validate the projectType value
  if (doc.projectType === 'story') {
    return 'story';
  }
  
  // Default to 'script' for any other value (including 'script' itself)
  return 'script';
}

/**
 * Default view type for project navigation
 */
export type DefaultProjectView = 'outline' | 'editor';

/**
 * Returns the default view for a project type
 * 
 * @param projectType - The project type ('script' or 'story')
 * @returns The default view to navigate to ('outline' for story, 'editor' for script)
 */
export function getDefaultViewForProjectType(projectType: ProjectType): DefaultProjectView {
  return projectType === 'story' ? 'outline' : 'editor';
}

/**
 * Returns the display label for a project type
 * 
 * @param projectType - The project type ('script' or 'story')
 * @returns Human-readable label ('Script' or 'Story')
 */
export function getProjectTypeLabel(projectType: ProjectType): string {
  return projectType === 'story' ? 'Story' : 'Script';
}

/**
 * Returns the default title for a new project
 * 
 * @param projectType - The project type ('script' or 'story')
 * @returns Default title for the project
 */
export function getDefaultProjectTitle(projectType: ProjectType): string {
  return projectType === 'story' ? 'Untitled Story' : 'Untitled Script';
}

/**
 * Returns the default content for a new project
 * 
 * @param projectType - The project type ('script' or 'story')
 * @returns Default content for the project
 */
export function getDefaultProjectContent(projectType: ProjectType): string {
  return projectType === 'story'
    ? 'Chapter 1\n\nYour story begins here...'
    : 'SCENE 1\n\nINT. ROOM - DAY\n\nThe scene begins.';
}

/**
 * Options for creating a new project
 */
export interface CreateProjectOptions {
  type: ProjectType;
  title?: string;
  content?: string;
  logline?: string;
  aiAssisted?: boolean;
}

/**
 * Returns the toast title for a newly created project
 * 
 * @param projectType - The project type ('script' or 'story')
 * @param aiAssisted - Whether the project is AI-assisted
 * @returns Toast title string
 */
export function getProjectCreatedToastTitle(projectType: ProjectType, aiAssisted?: boolean): string {
  const typeLabel = getProjectTypeLabel(projectType);
  return aiAssisted ? `AI-Assisted ${typeLabel} Created` : `${typeLabel} Created`;
}

/**
 * Returns the toast description for a newly created project
 * 
 * @param projectType - The project type ('script' or 'story')
 * @param aiAssisted - Whether the project is AI-assisted
 * @returns Toast description string
 */
export function getProjectCreatedToastDescription(projectType: ProjectType, aiAssisted?: boolean): string {
  const typeLabel = getProjectTypeLabel(projectType).toLowerCase();
  if (aiAssisted) {
    return `Open the AI assistant to start creating your ${typeLabel}.`;
  }
  return projectType === 'story'
    ? 'A new untitled story has been added to your collection.'
    : 'A new untitled script has been added to your collection.';
}
