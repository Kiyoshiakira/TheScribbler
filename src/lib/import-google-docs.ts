/**
 * @fileoverview Import screenplay from Google Docs
 * This parses a Google Docs document structure and converts it to screenplay format
 */

import { ScriptDocument, ScriptBlock, ScriptBlockType } from './editor-types';

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
    throw new Error('Invalid Google Docs document structure');
  }

  const blocks: ScriptBlock[] = [];
  let blockIdCounter = 0;

  // Process each structural element in the document
  for (const element of googleDoc.body.content) {
    if (!element.paragraph) {
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
  
  for (const element of paragraph.elements) {
    if (element.textRun?.content) {
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
  const style = paragraph.paragraphStyle;
  const alignment = style?.alignment || 'START';
  const indentStart = style?.indentStart?.magnitude || 0;
  const indentEnd = style?.indentEnd?.magnitude || 0;
  const isBold = paragraph.elements.some(e => e.textRun?.textStyle?.bold);
  const isUpperCase = text === text.toUpperCase();

  // Scene Heading: Bold, uppercase, left-aligned
  // Typically starts with INT., EXT., or similar
  if (isBold && isUpperCase && alignment === 'START' && indentStart < 1) {
    const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|INTERIOR|EXTERIOR)/i;
    if (sceneHeadingPattern.test(text)) {
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

  // Character: Uppercase, indented left (around 2.2 inches)
  if (isUpperCase && indentStart >= 2.0 && indentStart <= 2.5 && indentEnd < 1) {
    return ScriptBlockType.CHARACTER;
  }

  // Parenthetical: Indented both sides, usually in parentheses
  if (indentStart >= 1.5 && indentEnd >= 1.5 && text.startsWith('(') && text.endsWith(')')) {
    return ScriptBlockType.PARENTHETICAL;
  }

  // Dialogue: Indented both sides (around 1.5 inches)
  if (indentStart >= 1.2 && indentStart <= 1.8 && indentEnd >= 1.2 && indentEnd <= 1.8) {
    return ScriptBlockType.DIALOGUE;
  }

  // Shot: Uppercase, may have specific keywords
  if (isUpperCase) {
    const shotPattern = /^(CLOSE ON|ANGLE ON|POV|WIDE SHOT|CLOSE UP|MEDIUM SHOT)/i;
    if (shotPattern.test(text)) {
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
  
  for (const block of doc.blocks) {
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
