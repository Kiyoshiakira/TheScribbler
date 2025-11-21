/**
 * @fileoverview Import screenplay from Google Docs
 * This parses a Google Docs document structure and converts it to screenplay format
 */

import { ScriptDocument, ScriptBlock, ScriptBlockType } from './editor-types';

// Screenplay formatting constants (in inches)
// These match the export values with small tolerance for round-trip compatibility
const CHARACTER_INDENT = 2.2;
const CHARACTER_INDENT_TOLERANCE = 0.2;

const DIALOGUE_INDENT = 1.5;
const DIALOGUE_INDENT_TOLERANCE = 0.2;

const PARENTHETICAL_INDENT_START = 1.8;
const PARENTHETICAL_INDENT_END = 2.0;
const PARENTHETICAL_INDENT_TOLERANCE = 0.2;

// Regular expression patterns for screenplay element detection
const SCENE_HEADING_PATTERN = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|INTERIOR|EXTERIOR)/i;
const SHOT_PATTERN = /^(CLOSE ON|ANGLE ON|POV|WIDE SHOT|CLOSE UP|MEDIUM SHOT)/i;

/**
 * Google Docs API document structure (simplified types)
 */
interface GoogleDocsDocument {
  body: {
    content: GoogleDocsStructuralElement[];
  };
}

interface GoogleDocsStructuralElement {
  paragraph?: GoogleDocsParagraph;
  table?: unknown;
  sectionBreak?: unknown;
}

interface GoogleDocsParagraph {
  elements: GoogleDocsParagraphElement[];
  paragraphStyle?: {
    namedStyleType?: string;
    alignment?: string;
    indentFirstLine?: { magnitude: number; unit: string };
    indentStart?: { magnitude: number; unit: string };
    indentEnd?: { magnitude: number; unit: string };
    spaceAbove?: { magnitude: number; unit: string };
    spaceBelow?: { magnitude: number; unit: string };
  };
}

interface GoogleDocsParagraphElement {
  textRun?: {
    content: string;
    textStyle?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      fontSize?: { magnitude: number; unit: string };
    };
  };
}

/**
 * Imports a screenplay from Google Docs format
 * @param googleDoc The Google Docs document object from the API
 * @returns A ScriptDocument with structured screenplay blocks
 */
export function importFromGoogleDocs(googleDoc: GoogleDocsDocument): ScriptDocument {
  if (!googleDoc?.body?.content) {
    throw new Error('Invalid Google Docs document structure: missing body.content property');
  }
  
  if (!Array.isArray(googleDoc.body.content)) {
    throw new Error('Invalid Google Docs document structure: body.content must be an array');
  }

  const blocks: ScriptBlock[] = [];
  let blockIdCounter = 0;

  // Process each structural element in the document
  for (const element of googleDoc.body.content) {
    if (!element?.paragraph) {
      continue; // Skip non-paragraph elements (tables, section breaks, etc.)
    }

    const paragraph = element.paragraph;
    const text = extractTextFromParagraph(paragraph);
    
    // Skip empty paragraphs
    if (!text.trim()) {
      continue;
    }

    // Determine the block type based on formatting
    const blockType = inferBlockType(paragraph, text);
    
    blocks.push({
      id: `imported-${blockIdCounter++}`,
      type: blockType,
      text: text.trim(),
    });
  }

  return { blocks };
}

/**
 * Extracts plain text from a paragraph element
 */
function extractTextFromParagraph(paragraph: GoogleDocsParagraph): string {
  let text = '';
  
  // Ensure elements array exists with a default empty array
  const elements = paragraph?.elements || [];
  
  for (const element of elements) {
    if (element?.textRun?.content) {
      text += element.textRun.content;
    }
  }
  
  return text;
}

/**
 * Infers the screenplay block type based on Google Docs paragraph formatting
 * This uses alignment, indentation, and text style to determine the type
 */
function inferBlockType(paragraph: GoogleDocsParagraph, text: string): ScriptBlockType {
  const style = paragraph?.paragraphStyle || {};
  const alignment = style?.alignment || 'START';
  const indentStart = style?.indentStart?.magnitude || 0;
  const indentEnd = style?.indentEnd?.magnitude || 0;
  const elements = paragraph?.elements || [];
  const isBold = elements.some(e => e?.textRun?.textStyle?.bold);
  const hasLetters = /[A-Za-z]/.test(text);
  const isUpperCase = hasLetters && text === text.toUpperCase();

  // Scene Heading: Bold, uppercase, left-aligned
  // Typically starts with INT., EXT., or similar
  if (isBold && isUpperCase && alignment === 'START' && indentStart < 1) {
    if (SCENE_HEADING_PATTERN.test(text)) {
      return ScriptBlockType.SCENE_HEADING;
    }
  }

  // Section: Bold, centered, uppercase
  if (isBold && alignment === 'CENTER' && isUpperCase) {
    return ScriptBlockType.SECTION;
  }

  // Centered: Center-aligned
  if (alignment === 'CENTER') {
    return ScriptBlockType.CENTERED;
  }

  // Transition: Bold, right-aligned (END alignment)
  if (alignment === 'END' && isBold) {
    return ScriptBlockType.TRANSITION;
  }

  // Character: Uppercase, indented left (2.2 inches ± tolerance)
  const isCharacterIndent = Math.abs(indentStart - CHARACTER_INDENT) <= CHARACTER_INDENT_TOLERANCE;
  if (isUpperCase && isCharacterIndent && indentEnd < 1) {
    return ScriptBlockType.CHARACTER;
  }

  // Parenthetical: Indented both sides (1.8" left, 2.0" right ± tolerance), usually in parentheses
  const isParentheticalIndentStart = Math.abs(indentStart - PARENTHETICAL_INDENT_START) <= PARENTHETICAL_INDENT_TOLERANCE;
  const isParentheticalIndentEnd = Math.abs(indentEnd - PARENTHETICAL_INDENT_END) <= PARENTHETICAL_INDENT_TOLERANCE;
  if (isParentheticalIndentStart && isParentheticalIndentEnd && text.startsWith('(') && text.endsWith(')')) {
    return ScriptBlockType.PARENTHETICAL;
  }

  // Dialogue: Indented both sides (1.5 inches ± tolerance)
  const isDialogueIndentStart = Math.abs(indentStart - DIALOGUE_INDENT) <= DIALOGUE_INDENT_TOLERANCE;
  const isDialogueIndentEnd = Math.abs(indentEnd - DIALOGUE_INDENT) <= DIALOGUE_INDENT_TOLERANCE;
  if (isDialogueIndentStart && isDialogueIndentEnd) {
    return ScriptBlockType.DIALOGUE;
  }

  // Shot: Uppercase, may have specific keywords
  if (isUpperCase) {
    if (SHOT_PATTERN.test(text)) {
      return ScriptBlockType.SHOT;
    }
  }

  // Default to ACTION for everything else
  return ScriptBlockType.ACTION;
}

/**
 * Converts a ScriptDocument back to plain text format
 * This is useful for rendering or further processing
 */
export function scriptDocumentToText(doc: ScriptDocument): string {
  let output = '';
  
  // Ensure blocks array exists with a default empty array
  const blocks = doc?.blocks || [];
  
  for (const block of blocks) {
    // Skip blocks with missing or invalid text
    if (!block || typeof block.text !== 'string') {
      continue;
    }
    
    // Add appropriate spacing and formatting based on block type
    switch (block.type) {
      case ScriptBlockType.SCENE_HEADING:
        if (output) output += '\n\n';
        output += block.text.toUpperCase() + '\n';
        break;
        
      case ScriptBlockType.CHARACTER:
        if (output && !output.endsWith('\n\n')) output += '\n';
        output += block.text.toUpperCase() + '\n';
        break;
        
      case ScriptBlockType.DIALOGUE:
        output += block.text + '\n';
        break;
        
      case ScriptBlockType.PARENTHETICAL:
        output += block.text + '\n';
        break;
        
      case ScriptBlockType.TRANSITION:
        if (output) output += '\n';
        output += block.text.toUpperCase() + '\n';
        break;
        
      case ScriptBlockType.CENTERED:
        if (output) output += '\n';
        output += block.text + '\n';
        break;
        
      case ScriptBlockType.SECTION:
        if (output) output += '\n\n';
        output += block.text + '\n';
        break;
        
      case ScriptBlockType.ACTION:
      default:
        if (output && !output.endsWith('\n\n')) output += '\n';
        output += block.text + '\n';
        break;
    }
  }
  
  return output;
}

/**
 * Extracts plain text from Google Docs content structure
 * Used as a fallback when structured import fails
 */
export function extractPlainTextFromGoogleDocs(content: unknown): string {
  let text = '';
  
  if (!Array.isArray(content)) {
    return text;
  }
  
  // Use the existing GoogleDocsStructuralElement interface for type safety
  content.forEach((element: GoogleDocsStructuralElement) => {
    const elements = element?.paragraph?.elements || [];
    if (Array.isArray(elements)) {
      elements.forEach((elem: GoogleDocsParagraphElement) => {
        if (elem?.textRun?.content) {
          text += elem.textRun.content;
        }
      });
    }
  });
  
  return text;
}
