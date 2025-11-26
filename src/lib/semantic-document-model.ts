/**
 * @fileoverview Semantic Document Model
 * 
 * This module provides a semantic document model that preserves both text and meaning
 * of screenplay and story elements. It includes unique IDs, metadata, and semantic
 * relationships between elements.
 */

import { ScriptBlock, ScriptBlockType, ScriptDocument } from './editor-types';

/**
 * Metadata for a semantic block, preserving meaning and context
 */
export interface BlockMetadata {
  /** The semantic role of this block in the story */
  semanticRole?: 'setup' | 'conflict' | 'resolution' | 'character-introduction' | 'plot-point' | 'turning-point' | 'climax' | 'denouement';
  
  /** Scene number if this is or belongs to a scene */
  sceneNumber?: number;
  
  /** Character ID if this block relates to a specific character */
  characterId?: string;
  
  /** Characters present in this block */
  characterIds?: string[];
  
  /** Parent block ID for hierarchical relationships */
  parentId?: string;
  
  /** Index position in the document */
  index: number;
  
  /** Timestamp of creation */
  createdAt?: number;
  
  /** Timestamp of last modification */
  updatedAt?: number;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Additional custom metadata */
  custom?: Record<string, any>;
}

/**
 * A semantic block that includes both content and semantic metadata
 */
export interface SemanticBlock extends ScriptBlock {
  /** Semantic metadata for this block */
  metadata: BlockMetadata;
}

/**
 * A semantic document that preserves meaning and relationships
 */
export interface SemanticDocument {
  /** All blocks with semantic metadata */
  blocks: SemanticBlock[];
  
  /** Document-level metadata */
  documentMetadata: {
    title?: string;
    logline?: string;
    genre?: string[];
    themes?: string[];
    universe?: string; // e.g., "Skylantia"
    worldTerminology?: Record<string, string>; // e.g., { "Legumians": "description", "Deep Rooting": "description" }
    characterNames?: string[];
    totalScenes?: number;
  };
  
  /** Character relationships and mentions */
  characterGraph?: {
    [characterId: string]: {
      name: string;
      mentionedInBlocks: string[];
      relatedCharacters: string[];
    };
  };
  
  /** Scene structure */
  sceneStructure?: {
    sceneId: string;
    sceneNumber: number;
    heading: string;
    blockIds: string[];
    characters: string[];
  }[];
}

/**
 * Convert a standard ScriptDocument to a SemanticDocument
 */
export function enrichDocumentWithSemantics(
  document: ScriptDocument,
  additionalMetadata?: Partial<SemanticDocument['documentMetadata']>
): SemanticDocument {
  const semanticBlocks: SemanticBlock[] = [];
  const characterGraph: SemanticDocument['characterGraph'] = {};
  const sceneStructure: SemanticDocument['sceneStructure'] = [];
  
  let currentSceneNumber = 0;
  let currentSceneId: string | null = null;
  let currentSceneBlocks: string[] = [];
  let currentSceneHeading = '';
  let currentSceneCharacters = new Set<string>();
  
  document.blocks.forEach((block, index) => {
    // Detect scene headings
    if (block.type === ScriptBlockType.SCENE_HEADING) {
      // Save previous scene if exists
      if (currentSceneId) {
        sceneStructure.push({
          sceneId: currentSceneId,
          sceneNumber: currentSceneNumber,
          heading: currentSceneHeading,
          blockIds: currentSceneBlocks,
          characters: Array.from(currentSceneCharacters),
        });
      }
      
      // Start new scene
      currentSceneNumber++;
      currentSceneId = block.id;
      currentSceneBlocks = [block.id];
      currentSceneHeading = block.text;
      currentSceneCharacters = new Set();
    } else if (currentSceneId) {
      currentSceneBlocks.push(block.id);
    }
    
    // Detect characters
    let characterId: string | undefined;
    if (block.type === ScriptBlockType.CHARACTER) {
      characterId = extractCharacterName(block.text);
      if (characterId) {
        currentSceneCharacters.add(characterId);
        
        if (!characterGraph[characterId]) {
          characterGraph[characterId] = {
            name: characterId,
            mentionedInBlocks: [],
            relatedCharacters: [],
          };
        }
        characterGraph[characterId].mentionedInBlocks.push(block.id);
      }
    }
    
    // Create semantic block
    const semanticBlock: SemanticBlock = {
      ...block,
      metadata: {
        index,
        sceneNumber: currentSceneNumber > 0 ? currentSceneNumber : undefined,
        characterId,
        characterIds: block.type === ScriptBlockType.DIALOGUE && characterId ? [characterId] : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
    
    semanticBlocks.push(semanticBlock);
  });
  
  // Save final scene
  if (currentSceneId) {
    sceneStructure.push({
      sceneId: currentSceneId,
      sceneNumber: currentSceneNumber,
      heading: currentSceneHeading,
      blockIds: currentSceneBlocks,
      characters: Array.from(currentSceneCharacters),
    });
  }
  
  // Extract character names from character graph
  const characterNames = Object.keys(characterGraph);
  
  return {
    blocks: semanticBlocks,
    documentMetadata: {
      totalScenes: currentSceneNumber,
      characterNames,
      ...additionalMetadata,
    },
    characterGraph,
    sceneStructure,
  };
}

/**
 * Extract character name from a CHARACTER block
 */
function extractCharacterName(text: string): string {
  // Remove parentheticals like (O.S.), (V.O.), (CONT'D)
  return text
    .replace(/\(.*?\)/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Convert a SemanticDocument back to a standard ScriptDocument
 */
export function semanticToStandardDocument(semanticDoc: SemanticDocument): ScriptDocument {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    blocks: semanticDoc.blocks.map(({ metadata, ...block }) => block),
  };
}

/**
 * Get blocks by scene number
 */
export function getBlocksByScene(doc: SemanticDocument, sceneNumber: number): SemanticBlock[] {
  return doc.blocks.filter(block => block.metadata.sceneNumber === sceneNumber);
}

/**
 * Get blocks by character
 */
export function getBlocksByCharacter(doc: SemanticDocument, characterId: string): SemanticBlock[] {
  return doc.blocks.filter(block => 
    block.metadata.characterId === characterId ||
    block.metadata.characterIds?.includes(characterId)
  );
}

/**
 * Get context around a specific block (for RAG)
 */
export function getBlockContext(
  doc: SemanticDocument,
  blockId: string,
  contextRadius: number = 5
): SemanticBlock[] {
  const blockIndex = doc.blocks.findIndex(b => b.id === blockId);
  if (blockIndex === -1) return [];
  
  const startIndex = Math.max(0, blockIndex - contextRadius);
  const endIndex = Math.min(doc.blocks.length, blockIndex + contextRadius + 1);
  
  return doc.blocks.slice(startIndex, endIndex);
}

/**
 * Serialize semantic document to JSON
 */
export function serializeSemanticDocument(doc: SemanticDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Parse semantic document from JSON
 */
export function parseSemanticDocument(json: string): SemanticDocument {
  return JSON.parse(json) as SemanticDocument;
}
