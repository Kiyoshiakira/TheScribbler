/**
 * @fileoverview Export screenplay to Google Docs
 * This creates a properly formatted screenplay document in Google Docs
 */

import { ScriptDocument, ScriptBlockType } from './editor-types';

/**
 * Google Docs API request structure for document creation
 */
interface GoogleDocsRequest {
  requests: Array<{
    insertText?: {
      location: { index: number };
      text: string;
    };
    updateParagraphStyle?: {
      range: { startIndex: number; endIndex: number };
      paragraphStyle: {
        namedStyleType?: string;
        alignment?: string;
        indentFirstLine?: { magnitude: number; unit: string };
        indentStart?: { magnitude: number; unit: string };
        indentEnd?: { magnitude: number; unit: string };
        spaceAbove?: { magnitude: number; unit: string };
        spaceBelow?: { magnitude: number; unit: string };
      };
      fields: string;
    };
    updateTextStyle?: {
      range: { startIndex: number; endIndex: number };
      textStyle: {
        bold?: boolean;
        fontSize?: { magnitude: number; unit: string };
      };
      fields: string;
    };
  }>;
}

/**
 * Exports a screenplay to Google Docs
 * @param scriptDoc The structured ScriptDocument
 * @param title The title for the Google Doc
 * @param accessToken Google OAuth access token
 * @returns Promise that resolves to the created document ID
 */
export async function exportToGoogleDocs(
  scriptDoc: ScriptDocument,
  title: string,
  accessToken: string
): Promise<string> {
  if (!scriptDoc || !scriptDoc.blocks) {
    throw new Error('Invalid script document');
  }

  if (!accessToken) {
    throw new Error('Google access token is required');
  }

  // Step 1: Create a new Google Doc via server-side API to avoid CORS issues
  const createResponse = await fetch('/api/google-docs/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title || 'Untitled Screenplay',
      accessToken,
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create Google Doc: ${errorText}`);
  }

  const createData = await createResponse.json();
  if (!createData.success) {
    throw new Error(createData.error || 'Failed to create Google Doc');
  }
  const documentId = createData.documentId;

  // Step 2: Build the content and formatting requests
  const requests = buildGoogleDocsRequests(scriptDoc, title);

  // Step 3: Update the document with screenplay content via server-side API
  const updateResponse = await fetch('/api/google-docs/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      requests,
      accessToken,
    }),
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update Google Doc: ${errorText}`);
  }

  const updateData = await updateResponse.json();
  if (!updateData.success) {
    throw new Error(updateData.error || 'Failed to update Google Doc');
  }

  return documentId;
}

/**
 * Builds the batch update requests for Google Docs API
 */
function buildGoogleDocsRequests(scriptDoc: ScriptDocument, title?: string): GoogleDocsRequest['requests'] {
  const requests: GoogleDocsRequest['requests'] = [];
  let currentIndex = 1; // Google Docs starts at index 1

  // Add title if provided
  if (title) {
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: title.toUpperCase() + '\n\n\n',
      },
    });
    
    const titleEndIndex = currentIndex + title.length;
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: currentIndex, endIndex: titleEndIndex },
        paragraphStyle: {
          alignment: 'CENTER',
          spaceAbove: { magnitude: 72, unit: 'PT' },
          spaceBelow: { magnitude: 36, unit: 'PT' },
        },
        fields: 'alignment,spaceAbove,spaceBelow',
      },
    });
    
    requests.push({
      updateTextStyle: {
        range: { startIndex: currentIndex, endIndex: titleEndIndex },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 14, unit: 'PT' },
        },
        fields: 'bold,fontSize',
      },
    });
    
    currentIndex = titleEndIndex + 3; // Account for newlines
  }

  // Process each block
  for (let i = 0; i < scriptDoc.blocks.length; i++) {
    const block = scriptDoc.blocks[i];
    const prevBlock = i > 0 ? scriptDoc.blocks[i - 1] : null;

    // Add spacing before certain elements
    const needsSpaceBefore = 
      block.type === ScriptBlockType.SCENE_HEADING ||
      (block.type === ScriptBlockType.CHARACTER && 
       prevBlock?.type !== ScriptBlockType.DIALOGUE && 
       prevBlock?.type !== ScriptBlockType.PARENTHETICAL);

    if (needsSpaceBefore && i > 0) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '\n',
        },
      });
      currentIndex += 1;
    }

    const { text: blockText, styles } = formatBlockForGoogleDocs(block);
    const textToInsert = blockText + '\n';
    
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: textToInsert,
      },
    });

    const blockStartIndex = currentIndex;
    const blockEndIndex = currentIndex + blockText.length;

    // Apply paragraph styling
    if (styles.paragraphStyle) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: blockStartIndex, endIndex: blockEndIndex },
          paragraphStyle: styles.paragraphStyle,
          fields: styles.paragraphFields || 'alignment,indentStart,indentEnd,indentFirstLine',
        },
      });
    }

    // Apply text styling
    if (styles.textStyle) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: blockStartIndex, endIndex: blockEndIndex },
          textStyle: styles.textStyle,
          fields: styles.textFields || 'bold',
        },
      });
    }

    currentIndex = blockEndIndex + 1; // Account for newline
  }

  return requests;
}

/**
 * Formats a block for Google Docs with appropriate styling
 */
function formatBlockForGoogleDocs(block: { type: string; text: string }): {
  text: string;
  styles: {
    paragraphStyle?: Record<string, unknown>;
    paragraphFields?: string;
    textStyle?: Record<string, unknown>;
    textFields?: string;
  };
} {
  switch (block.type) {
    case ScriptBlockType.SCENE_HEADING:
      return {
        text: block.text.toUpperCase(),
        styles: {
          paragraphStyle: {
            spaceAbove: { magnitude: 12, unit: 'PT' },
          },
          paragraphFields: 'spaceAbove',
          textStyle: { bold: true },
          textFields: 'bold',
        },
      };

    case ScriptBlockType.CHARACTER:
      return {
        text: block.text.toUpperCase(),
        styles: {
          paragraphStyle: {
            indentStart: { magnitude: 2.2, unit: 'IN' },
            spaceAbove: { magnitude: 12, unit: 'PT' },
          },
          paragraphFields: 'indentStart,spaceAbove',
        },
      };

    case ScriptBlockType.DIALOGUE:
      return {
        text: block.text,
        styles: {
          paragraphStyle: {
            indentStart: { magnitude: 1.5, unit: 'IN' },
            indentEnd: { magnitude: 1.5, unit: 'IN' },
          },
          paragraphFields: 'indentStart,indentEnd',
        },
      };

    case ScriptBlockType.PARENTHETICAL:
      return {
        text: block.text,
        styles: {
          paragraphStyle: {
            indentStart: { magnitude: 1.8, unit: 'IN' },
            indentEnd: { magnitude: 2.0, unit: 'IN' },
          },
          paragraphFields: 'indentStart,indentEnd',
        },
      };

    case ScriptBlockType.TRANSITION:
      const transitionText = block.text.replace(/^>\s*/, '').toUpperCase();
      return {
        text: transitionText,
        styles: {
          paragraphStyle: {
            alignment: 'END',
            spaceAbove: { magnitude: 12, unit: 'PT' },
          },
          paragraphFields: 'alignment,spaceAbove',
          textStyle: { bold: true },
          textFields: 'bold',
        },
      };

    case ScriptBlockType.CENTERED:
      const centeredText = block.text.replace(/^>\s*/, '').replace(/\s*<$/, '');
      return {
        text: centeredText,
        styles: {
          paragraphStyle: {
            alignment: 'CENTER',
          },
          paragraphFields: 'alignment',
        },
      };

    case ScriptBlockType.SECTION:
      const sectionText = block.text.replace(/^#+\s*/, '').toUpperCase();
      return {
        text: sectionText,
        styles: {
          paragraphStyle: {
            alignment: 'CENTER',
            spaceAbove: { magnitude: 24, unit: 'PT' },
            spaceBelow: { magnitude: 12, unit: 'PT' },
          },
          paragraphFields: 'alignment,spaceAbove,spaceBelow',
          textStyle: { bold: true },
          textFields: 'bold',
        },
      };

    case ScriptBlockType.ACTION:
    default:
      return {
        text: block.text,
        styles: {
          paragraphStyle: {},
        },
      };
  }
}

/**
 * Gets the Google Docs URL for a document
 */
export function getGoogleDocsUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/edit`;
}
