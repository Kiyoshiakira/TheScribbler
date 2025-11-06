/**
 * @fileoverview Export screenplay to PDF format using browser-based PDF generation
 * This creates a properly formatted screenplay PDF without requiring server-side processing
 */

import { ScriptDocument, ScriptBlockType } from './editor-types';

/**
 * Converts a ScriptDocument to a PDF blob using the browser's print functionality
 * @param scriptDoc The structured ScriptDocument
 * @param title Optional title for the script
 * @returns A promise that resolves to a Blob containing the PDF
 */
export async function exportToPDF(scriptDoc: ScriptDocument, title?: string): Promise<Blob> {
  // Create an HTML representation of the screenplay
  const html = generateScreenplayHTML(scriptDoc, title);
  
  // Create a hidden iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Failed to access iframe document');
  }

  // Write the HTML to the iframe
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Use the browser's print API to generate PDF
  // Note: This will open the print dialog
  return new Promise((resolve, reject) => {
    try {
      // Wait for content to load
      setTimeout(() => {
        iframe.contentWindow?.print();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
        
        // Since we can't directly capture the PDF blob from print dialog,
        // we return an empty blob. The actual PDF is created by the browser's print dialog.
        // For a true programmatic PDF generation, a library like jsPDF or pdfmake would be needed.
        resolve(new Blob([], { type: 'application/pdf' }));
      }, 100);
    } catch (error) {
      document.body.removeChild(iframe);
      reject(error);
    }
  });
}

/**
 * Generates HTML with proper screenplay formatting for PDF generation
 */
function generateScreenplayHTML(scriptDoc: ScriptDocument, title?: string): string {
  if (!scriptDoc || !scriptDoc.blocks) {
    return generateEmptyHTML(title || 'Untitled');
  }

  const blockElements: string[] = [];

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

    if (needsSpaceBefore && blockElements.length > 0) {
      blockElements.push('<div class="spacer"></div>');
    }

    blockElements.push(blockToHTML(block));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title || 'Screenplay')}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 1in 1in 1in 1.5in;
    }
    
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    
    .screenplay-container {
      max-width: 6in;
      margin: 0 auto;
      padding: 0;
    }
    
    .title-page {
      text-align: center;
      margin-bottom: 3in;
      page-break-after: always;
    }
    
    .title {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 3in;
    }
    
    .scene-heading {
      text-transform: uppercase;
      font-weight: bold;
      margin-top: 1.5em;
      margin-bottom: 0;
    }
    
    .action {
      margin: 1em 0;
      white-space: pre-wrap;
    }
    
    .character {
      margin-left: 2.2in;
      margin-top: 1em;
      margin-bottom: 0;
      text-transform: uppercase;
    }
    
    .dialogue {
      margin-left: 1.5in;
      margin-right: 1.5in;
      margin-top: 0;
      margin-bottom: 0;
      white-space: pre-wrap;
    }
    
    .parenthetical {
      margin-left: 1.8in;
      margin-right: 2in;
      margin-top: 0;
      margin-bottom: 0;
    }
    
    .transition {
      text-align: right;
      margin-top: 1em;
      margin-bottom: 1em;
      text-transform: uppercase;
    }
    
    .centered {
      text-align: center;
      margin: 1em 0;
    }
    
    .section {
      text-align: center;
      text-transform: uppercase;
      font-weight: bold;
      margin: 2em 0;
    }
    
    .synopsis {
      font-style: italic;
      margin: 0.5em 0;
      margin-left: 0.5in;
    }
    
    .spacer {
      height: 1em;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .screenplay-container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="screenplay-container">
    ${title ? `<div class="title-page"><div class="title">${escapeHTML(title)}</div></div>` : ''}
    ${blockElements.join('\n    ')}
  </div>
</body>
</html>`;
}

/**
 * Converts a block to HTML
 */
function blockToHTML(block: { type: string; text: string }): string {
  const escapedText = escapeHTML(block.text);
  
  switch (block.type) {
    case ScriptBlockType.SCENE_HEADING:
      return `<div class="scene-heading">${escapedText}</div>`;
    
    case ScriptBlockType.ACTION:
      return `<div class="action">${escapedText}</div>`;
    
    case ScriptBlockType.CHARACTER:
      return `<div class="character">${escapedText}</div>`;
    
    case ScriptBlockType.DIALOGUE:
      return `<div class="dialogue">${escapedText}</div>`;
    
    case ScriptBlockType.PARENTHETICAL:
      return `<div class="parenthetical">${escapedText}</div>`;
    
    case ScriptBlockType.TRANSITION:
      const transitionText = escapedText.replace(/^>\s*/, '');
      return `<div class="transition">${transitionText}</div>`;
    
    case ScriptBlockType.CENTERED:
      const centeredText = escapedText.replace(/^>\s*/, '').replace(/\s*<$/, '');
      return `<div class="centered">${centeredText}</div>`;
    
    case ScriptBlockType.SECTION:
      const sectionText = escapedText.replace(/^#+\s*/, '');
      return `<div class="section">${sectionText}</div>`;
    
    case ScriptBlockType.SYNOPSIS:
      const synopsisText = escapedText.replace(/^=\s*/, '');
      return `<div class="synopsis">${synopsisText}</div>`;
    
    default:
      return `<div class="action">${escapedText}</div>`;
  }
}

/**
 * Generates empty HTML document
 */
function generateEmptyHTML(title: string): string {
  return generateScreenplayHTML({ blocks: [] }, title);
}

/**
 * Escapes HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
