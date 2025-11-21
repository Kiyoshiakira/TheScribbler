/**
 * @fileoverview Defines the core data structures for the structured screenplay editor.
 */

// Using a const object for string enum pattern, which is common in modern JS/TS.
export const ScriptBlockType = {
  SCENE_HEADING: 'scene-heading',
  ACTION: 'action',
  CHARACTER: 'character',
  PARENTHETICAL: 'parenthetical',
  DIALOGUE: 'dialogue',
  TRANSITION: 'transition',
  SHOT: 'shot',
  CENTERED: 'centered',
  SECTION: 'section',
  SYNOPSIS: 'synopsis',
} as const;

// Type alias for the values of the ScriptBlockType object.
export type ScriptBlockType = (typeof ScriptBlockType)[keyof typeof ScriptBlockType];

/**
 * Represents a single, distinct block within the screenplay.
 * Each block has a type and its corresponding text content.
 */
export interface ScriptBlock {
  id: string; // A unique identifier for the block, e.g., a nanoid
  type: ScriptBlockType;
  text: string;
}

/**
 * Represents the entire screenplay document as a structured list of blocks.
 * This is the root of our document model.
 */
export interface ScriptDocument {
  blocks: ScriptBlock[];
}

/**
 * Represents a single version entry in the document's version history.
 */
export interface DocumentVersion {
  id: string; // Firestore document ID
  title: string;
  logline: string;
  content: string; // Serialized script content
  timestamp: any; // Firestore timestamp
  note?: string; // Optional user note about this version
}
