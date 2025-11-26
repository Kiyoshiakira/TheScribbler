/**
 * @fileoverview Import DOCX files and parse them into story structure
 */

import mammoth from 'mammoth';

export interface Chapter {
  title: string;
  summary?: string;
  content: string;
  order: number;
}

export interface ParsedDocx {
  title: string;
  logline?: string;
  chapters: Chapter[];
}

/**
 * Parses HTML content (from DOCX) into story structure
 * @param htmlContent The HTML content from mammoth
 * @returns Parsed story data
 */
function parseHtmlToStory(htmlContent: string): ParsedDocx {
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  let title = 'Untitled Story';
  let logline: string | undefined;
  const chapters: Chapter[] = [];
  
  let currentChapter: Partial<Chapter> | null = null;
  let currentContent: string[] = [];
  let chapterOrder = 0;
  let foundTitle = false;

  // Walk through all elements
  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent?.trim() || '';

      if (!text) continue;

      // H1 - Main title or chapter
      if (tagName === 'h1') {
        if (!foundTitle) {
          title = text;
          foundTitle = true;
        } else {
          // Save previous chapter
          if (currentChapter) {
            currentChapter.content = currentContent.join('\n\n').trim();
            chapters.push(currentChapter as Chapter);
            currentContent = [];
          }

          // New chapter
          const chapterTitle = text.replace(/^Chapter\s+\d+:\s*/i, '');
          currentChapter = {
            title: chapterTitle,
            order: chapterOrder++,
            content: '',
          };
        }
        continue;
      }

      // H2/H3 - Chapter headings
      if (tagName === 'h2' || tagName === 'h3') {
        // Save previous chapter
        if (currentChapter) {
          currentChapter.content = currentContent.join('\n\n').trim();
          chapters.push(currentChapter as Chapter);
          currentContent = [];
        }

        // New chapter
        const chapterTitle = text.replace(/^Chapter\s+\d+:\s*/i, '');
        currentChapter = {
          title: chapterTitle,
          order: chapterOrder++,
          content: '',
        };
        
        continue;
      }

      // Paragraph
      if (tagName === 'p') {
        // Check if this might be a logline (italic paragraph near the beginning)
        if (!logline && !currentChapter && element.querySelector('em, i')) {
          logline = text;
        } else if (currentChapter) {
          currentContent.push(text);
        }
        
        continue;
      }
    }
  }

  // Save last chapter
  if (currentChapter) {
    currentChapter.content = currentContent.join('\n\n').trim();
    chapters.push(currentChapter as Chapter);
  }

  // If no chapters were found, treat the entire content as a single chapter
  if (chapters.length === 0 && currentContent.length > 0) {
    chapters.push({
      title: 'Chapter 1',
      content: currentContent.join('\n\n').trim(),
      order: 0,
    });
  }

  return {
    title,
    logline,
    chapters,
  };
}

/**
 * Imports a DOCX file and parses it into story structure
 * @param file The DOCX file
 * @returns Promise that resolves to parsed story data
 */
export async function importDocxFile(file: File): Promise<ParsedDocx> {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert DOCX to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // Parse HTML to story structure
    return parseHtmlToStory(result.value);
  } catch (error) {
    console.error('Error importing DOCX file:', error);
    throw new Error('Failed to import DOCX file. Please ensure it is a valid Word document.');
  }
}

/**
 * Alternative: Extract plain text from DOCX
 * @param file The DOCX file
 * @returns Promise that resolves to plain text
 */
export async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file.');
  }
}
