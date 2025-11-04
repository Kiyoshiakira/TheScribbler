/**
 * @fileoverview A parser to convert raw screenplay text into a structured document model.
 */

import { ScriptBlock, ScriptBlockType, ScriptDocument } from './editor-types';

// Regular expressions to identify different screenplay elements.
// These are inspired by the Fountain syntax and common screenplay formats.
const Patterns = {
  // Scene headings: INT. or EXT., followed by a location and time of day.
  // Handles variations like I/E. and INT./EXT. Also detects forced scene headings starting with a period.
  sceneHeading: /^(INT|EXT|I\/E|INT\.\/EXT)\..*|^\..+/i,
  // Transitions: e.g., FADE IN:, CUT TO:, DISSOLVE TO. Must be on its own line and often at the end.
  transition: /(FADE (IN|OUT):|CUT TO:|DISSOLVE TO:|SMASH CUT TO:|>.*)$/,
  // Character names: Typically all caps, not followed by dialogue on the same line.
  // Must not be a scene heading. Should be on a line by itself.
  character: /^[A-Z][A-Z0-9 \t]+(?:\(V\.O\.\)|\(O\.S\.\))?$/,
  // Parentheticals: Enclosed in parentheses on their own line.
  parenthetical: /^\(.*\)$/,
};

/**
 * A simple unique ID generator for blocks. In a real app, a library like nanoid would be better.
 */
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

/**
 * Analyzes a line of text and determines its script block type.
 * @param line The line of text to analyze.
 * @param previousBlockType The type of the block that came before this line, for context.
 * @returns The determined ScriptBlockType.
 */
const getBlockType = (line: string, previousBlockType: ScriptBlockType | null): ScriptBlockType => {
  const trimmedLine = line.trim();

  // Forced scene headings take top priority
  if (trimmedLine.startsWith('.')) {
      return ScriptBlockType.SCENE_HEADING;
  }
  
  // Transitions are often uppercase and on their own.
  if (Patterns.transition.test(trimmedLine) && trimmedLine.toUpperCase() === trimmedLine) {
    return ScriptBlockType.TRANSITION;
  }

  // Scene headings are usually uppercase.
  if (Patterns.sceneHeading.test(trimmedLine)) {
    return ScriptBlockType.SCENE_HEADING;
  }
  
  // A parenthetical must follow a character or another parenthetical.
  if (Patterns.parenthetical.test(trimmedLine) && (previousBlockType === ScriptBlockType.CHARACTER || previousBlockType === ScriptBlockType.PARENTHETICAL)) {
    return ScriptBlockType.PARENTHETICAL;
  }
  
  // Character names are uppercase and are not scene headings.
  if (Patterns.character.test(trimmedLine) && !Patterns.sceneHeading.test(trimmedLine)) {
    // Check if the next line is not empty, which suggests dialogue will follow.
    return ScriptBlockType.CHARACTER;
  }
  
  // Dialogue naturally follows a character or a parenthetical.
  if (previousBlockType === ScriptBlockType.CHARACTER || previousBlockType === ScriptBlockType.PARENTHETICAL) {
    return ScriptBlockType.DIALOGUE;
  }

  // If none of the above, it's an action/description line.
  return ScriptBlockType.ACTION;
};


/**
 * Parses a raw screenplay string into a structured ScriptDocument.
 *
 * @param rawScript The full text content of the screenplay.
 * @returns A ScriptDocument object representing the structured screenplay.
 */
export function parseScreenplay(rawScript: string): ScriptDocument {
  if (!rawScript || typeof rawScript !== 'string') {
    return { blocks: [] };
  }

  const lines = rawScript.split('\n');
  const blocks: ScriptBlock[] = [];
  let previousBlockType: ScriptBlockType | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines, but let them act as separators
    if (trimmedLine === '') {
        if (previousBlockType === ScriptBlockType.DIALOGUE) {
             // An empty line after dialogue often signifies the start of a new action.
             previousBlockType = ScriptBlockType.ACTION;
        }
        continue;
    }

    const currentBlockType = getBlockType(line, previousBlockType);

    // Merge consecutive action lines into a single block for better editing.
    if (currentBlockType === ScriptBlockType.ACTION && previousBlockType === ScriptBlockType.ACTION && blocks.length > 0) {
      blocks[blocks.length - 1].text += '\n' + line;
    } else {
      blocks.push({
        id: generateId(),
        type: currentBlockType,
        text: line,
      });
      previousBlockType = currentBlockType;
    }
  }

  return { blocks };
}

/**
 * Serializes a ScriptDocument back into a raw screenplay string.
 * This should produce a clean, readable text file.
 *
 * @param scriptDoc The structured ScriptDocument.
 * @returns A raw string representation of the screenplay.
 */
export function serializeScript(scriptDoc: ScriptDocument): string {
    if (!scriptDoc || !scriptDoc.blocks) {
        return '';
    }

    return scriptDoc.blocks.map(b => b.text).join('\n\n');
}

/**
 * Estimates various metrics for a screenplay document.
 * @param doc The ScriptDocument to analyze.
 * @returns An object with page count, character count, word count, and estimated minutes.
 */
export function estimateScriptMetrics(doc: ScriptDocument) {
  const linesPerPage = 55;
  let lineCount = 0;
  let charCount = 0;
  let wordCount = 0;

  doc.blocks.forEach(block => {
    const text = block.text;
    charCount += text.length;
    wordCount += text.split(/\s+/).filter(Boolean).length;

    // Add lines based on block type and content
    let blockHeight = 1; // Each block is at least one line
    if (block.type === ScriptBlockType.ACTION) {
      blockHeight = (text.match(/\n/g) || []).length + 1;
    }
    
    // Add extra spacing that screenplay formatters insert
    switch (block.type) {
        case ScriptBlockType.SCENE_HEADING:
        case ScriptBlockType.CHARACTER:
        case ScriptBlockType.TRANSITION:
            lineCount += 2; // Add space before these elements
            break;
    }

    lineCount += blockHeight;
  });
  
  const pageCount = Math.max(1, Math.ceil(lineCount / linesPerPage));
  const estimatedMinutes = pageCount;

  return {
    pageCount,
    charCount,
    wordCount,
    estimatedMinutes,
  };
}
