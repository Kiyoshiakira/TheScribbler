/**
 * @fileoverview Export screenplay to Final Draft FDX format
 * FDX is an XML-based format used by Final Draft screenwriting software
 */

import { ScriptDocument, ScriptBlockType } from './editor-types';

/**
 * Converts a ScriptDocument to Final Draft FDX format
 * @param scriptDoc The structured ScriptDocument
 * @param title Optional title for the script
 * @returns An XML string in FDX format
 */
export function exportToFinalDraft(scriptDoc: ScriptDocument, title?: string): string {
  if (!scriptDoc || !scriptDoc.blocks) {
    return generateEmptyFDX(title || 'Untitled');
  }

  const scriptTitle = title || 'Untitled';
  const paragraphs: string[] = [];

  // Process each block and convert to FDX paragraph
  for (const block of scriptDoc.blocks) {
    const paragraph = blockToFDXParagraph(block);
    if (paragraph) {
      paragraphs.push(paragraph);
    }
  }

  return generateFDX(scriptTitle, paragraphs);
}

/**
 * Converts a ScriptBlock to an FDX Paragraph element
 */
function blockToFDXParagraph(block: { type: string; text: string }): string {
  // Map our block types to FDX element types
  const typeMap: Record<string, string> = {
    [ScriptBlockType.SCENE_HEADING]: 'Scene Heading',
    [ScriptBlockType.ACTION]: 'Action',
    [ScriptBlockType.CHARACTER]: 'Character',
    [ScriptBlockType.DIALOGUE]: 'Dialogue',
    [ScriptBlockType.PARENTHETICAL]: 'Parenthetical',
    [ScriptBlockType.TRANSITION]: 'Transition',
    [ScriptBlockType.SHOT]: 'Shot',
    [ScriptBlockType.CENTERED]: 'Action', // FDX doesn't have centered, use action
    [ScriptBlockType.SECTION]: 'Action', // FDX doesn't have sections, use action
    [ScriptBlockType.SYNOPSIS]: 'Action', // FDX doesn't have synopsis, use action
  };

  const fdxType = typeMap[block.type] || 'Action';
  const escapedText = escapeXML(block.text);

  return `      <Paragraph Type="${fdxType}">
        <Text>${escapedText}</Text>
      </Paragraph>`;
}

/**
 * Generates a complete FDX document
 */
function generateFDX(title: string, paragraphs: string[]): string {
  const escapedTitle = escapeXML(title);
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
    <Paragraph Type="Action">
      <Text></Text>
    </Paragraph>
${paragraphs.join('\n')}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title">
        <Text>${escapedTitle}</Text>
      </Paragraph>
    </Content>
  </TitlePage>
  <ElementSettings Type="Scene Heading">
    <FontSpec Style="AllCaps+"/>
  </ElementSettings>
  <ElementSettings Type="Character">
    <FontSpec Style="AllCaps+"/>
  </ElementSettings>
  <ElementSettings Type="Transition">
    <FontSpec Style="AllCaps+"/>
    <Behavior Pagination="Top Of Next"/>
  </ElementSettings>
</FinalDraft>`;
}

/**
 * Generates an empty FDX document
 */
function generateEmptyFDX(title: string): string {
  return generateFDX(title, []);
}

/**
 * Escapes special XML characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
