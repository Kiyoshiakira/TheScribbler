/**
 * @fileoverview Export screenplay to plain text format
 */

import { ScriptDocument, ScriptBlockType } from './editor-types';

/**
 * Converts a ScriptDocument to formatted plain text
 * @param scriptDoc The structured ScriptDocument
 * @param title Optional title for the script
 * @returns A formatted plain text string
 */
export function exportToPlainText(scriptDoc: ScriptDocument, title?: string): string {
  if (!scriptDoc || !scriptDoc.blocks) {
    return '';
  }

  const lines: string[] = [];
  const pageWidth = 60; // Approximate character width for screenplay format

  // Add title if provided
  if (title) {
    const centeredTitle = centerText(title.toUpperCase(), pageWidth);
    lines.push(centeredTitle);
    lines.push('');
    lines.push('');
  }

  // Process each block
  for (let i = 0; i < scriptDoc.blocks.length; i++) {
    const block = scriptDoc.blocks[i];
    const prevBlock = i > 0 ? scriptDoc.blocks[i - 1] : null;

    // Add spacing before scene headings and characters
    const needsSpaceBefore = 
      block.type === ScriptBlockType.SCENE_HEADING ||
      (block.type === ScriptBlockType.CHARACTER && prevBlock?.type !== ScriptBlockType.DIALOGUE && prevBlock?.type !== ScriptBlockType.PARENTHETICAL);

    if (needsSpaceBefore && lines.length > 0) {
      lines.push('');
    }

    // Format the block based on its type
    switch (block.type) {
      case ScriptBlockType.SCENE_HEADING:
        lines.push(block.text.toUpperCase());
        lines.push('');
        break;

      case ScriptBlockType.CHARACTER:
        // Character names are indented and uppercase
        const characterLine = ' '.repeat(20) + block.text.toUpperCase();
        lines.push(characterLine);
        break;

      case ScriptBlockType.DIALOGUE:
        // Dialogue is indented
        const dialogueLines = block.text.split('\n');
        dialogueLines.forEach(line => {
          lines.push(' '.repeat(10) + line);
        });
        break;

      case ScriptBlockType.PARENTHETICAL:
        // Parentheticals are indented and wrapped in parentheses
        const parentheticalLine = ' '.repeat(15) + block.text;
        lines.push(parentheticalLine);
        break;

      case ScriptBlockType.ACTION:
        // Action is left-aligned
        lines.push(block.text);
        break;

      case ScriptBlockType.TRANSITION:
        // Transitions are right-aligned
        const transitionText = block.text.toUpperCase().replace(/^>\s*/, '');
        const transitionLine = ' '.repeat(Math.max(0, pageWidth - transitionText.length)) + transitionText;
        lines.push(transitionLine);
        lines.push('');
        break;

      case ScriptBlockType.CENTERED:
        // Centered text
        const centeredText = block.text.replace(/^>\s*/, '').replace(/\s*<$/, '');
        lines.push(centerText(centeredText, pageWidth));
        lines.push('');
        break;

      case ScriptBlockType.SECTION:
        // Section headings are centered and uppercase
        const sectionText = block.text.replace(/^#+\s*/, '');
        lines.push('');
        lines.push(centerText(sectionText.toUpperCase(), pageWidth));
        lines.push('');
        break;

      case ScriptBlockType.SYNOPSIS:
        // Synopsis as indented italic-style (since plain text, we'll use brackets)
        const synopsisText = block.text.replace(/^=\s*/, '');
        lines.push(' '.repeat(5) + '[' + synopsisText + ']');
        break;

      default:
        lines.push(block.text);
    }
  }

  return lines.join('\n');
}

/**
 * Helper function to center text within a given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}
