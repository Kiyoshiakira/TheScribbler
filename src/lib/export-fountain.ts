/**
 * @fileoverview Export screenplay to Fountain format
 * Fountain is a plain text markup language for screenwriting
 */

import { ScriptDocument, ScriptBlockType } from './editor-types';

/**
 * Converts a ScriptDocument to Fountain format
 * @param scriptDoc The structured ScriptDocument
 * @param title Optional title for the script (will be added as metadata)
 * @returns A string in Fountain format
 */
export function exportToFountain(scriptDoc: ScriptDocument, title?: string): string {
  if (!scriptDoc || !scriptDoc.blocks) {
    return '';
  }

  const lines: string[] = [];

  // Add title page metadata if provided
  if (title) {
    lines.push(`Title: ${title}`);
    lines.push('');
  }

  // Process each block
  for (let i = 0; i < scriptDoc.blocks.length; i++) {
    const block = scriptDoc.blocks[i];
    const prevBlock = i > 0 ? scriptDoc.blocks[i - 1] : null;

    // Add spacing before certain block types for readability
    const needsSpaceBefore = 
      block.type === ScriptBlockType.SCENE_HEADING ||
      (block.type === ScriptBlockType.CHARACTER && prevBlock?.type !== ScriptBlockType.DIALOGUE && prevBlock?.type !== ScriptBlockType.PARENTHETICAL);

    if (needsSpaceBefore && lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }

    // Format the block based on its type
    switch (block.type) {
      case ScriptBlockType.SCENE_HEADING:
        // Scene headings are uppercase in Fountain
        lines.push(block.text.toUpperCase());
        break;

      case ScriptBlockType.CHARACTER:
        // Character names are uppercase
        lines.push(block.text.toUpperCase());
        break;

      case ScriptBlockType.DIALOGUE:
        // Dialogue is plain text, indented by the renderer
        lines.push(block.text);
        break;

      case ScriptBlockType.PARENTHETICAL:
        // Parentheticals are wrapped in parentheses
        lines.push(block.text);
        break;

      case ScriptBlockType.ACTION:
        // Action/description is plain text
        lines.push(block.text);
        break;

      case ScriptBlockType.TRANSITION:
        // Transitions are uppercase and right-aligned in rendering
        // In Fountain, prefix with > to force right-align
        const transitionText = block.text.toUpperCase();
        lines.push(transitionText.startsWith('>') ? transitionText : `> ${transitionText}`);
        break;

      case ScriptBlockType.CENTERED:
        // Centered text is wrapped with > <
        const centeredMatch = block.text.match(/>\s*(.+?)\s*</);
        if (centeredMatch) {
          lines.push(block.text);
        } else {
          lines.push(`> ${block.text} <`);
        }
        break;

      case ScriptBlockType.SECTION:
        // Section headings start with #
        const sectionMatch = block.text.match(/^(#+)\s+(.*)$/);
        if (sectionMatch) {
          lines.push(block.text);
        } else {
          lines.push(`# ${block.text}`);
        }
        break;

      case ScriptBlockType.SYNOPSIS:
        // Synopsis starts with =
        const synopsisMatch = block.text.match(/^=\s*(.*)$/);
        if (synopsisMatch) {
          lines.push(block.text);
        } else {
          lines.push(`= ${block.text}`);
        }
        break;

      default:
        // For any unhandled types, just output the text as-is
        lines.push(block.text);
    }
  }

  // Join with single newlines; Fountain uses blank lines for separation
  return lines.join('\n');
}
