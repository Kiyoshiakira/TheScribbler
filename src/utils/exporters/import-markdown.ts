/**
 * @fileoverview Import Markdown files and parse them into story structure
 */

export interface Chapter {
  title: string;
  summary?: string;
  content: string;
  order: number;
}

export interface ParsedMarkdown {
  title: string;
  logline?: string;
  chapters: Chapter[];
}

/**
 * Parses Markdown content into story structure
 * @param markdownContent The raw Markdown content
 * @returns Parsed story data
 */
export function parseMarkdown(markdownContent: string): ParsedMarkdown {
  const lines = markdownContent.split('\n');
  
  let title: string | null = null;
  let logline: string | undefined;
  const chapters: Chapter[] = [];
  
  let currentChapter: Partial<Chapter> | null = null;
  let currentContent: string[] = [];
  let chapterOrder = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines at the start
    if (!title && !trimmedLine) continue;

    // Main title (first H1)
    if (trimmedLine.startsWith('# ') && !currentChapter) {
      title = trimmedLine.substring(2).trim();
      continue;
    }

    // Blockquote (potential logline)
    if (trimmedLine.startsWith('>')) {
      if (!logline && !currentChapter) {
        logline = trimmedLine.substring(1).trim();
      }
      continue;
    }

    // Chapter heading (H2 or H3)
    if (trimmedLine.match(/^#{2,3}\s+/)) {
      // Save previous chapter if exists
      if (currentChapter) {
        currentChapter.content = currentContent.join('\n').trim();
        chapters.push(currentChapter as Chapter);
        currentContent = [];
      }

      // Extract chapter title
      const headerMatch = trimmedLine.match(/^#{2,3}\s+(?:Chapter\s+\d+:\s*)?(.+)/i);
      const chapterTitle = headerMatch ? headerMatch[1].trim() : trimmedLine.replace(/^#{2,3}\s+/, '');

      currentChapter = {
        title: chapterTitle,
        order: chapterOrder++,
        content: '',
      };
      continue;
    }

    // Italic line (potential summary) right after chapter title
    if (currentChapter && !currentChapter.summary && trimmedLine.match(/^\*(.+)\*$/) && currentContent.length === 0) {
      currentChapter.summary = trimmedLine.replace(/^\*(.+)\*$/, '$1');
      continue;
    }

    // Horizontal rule (chapter separator)
    if (trimmedLine === '---' || trimmedLine === '***') {
      continue;
    }

    // Regular content
    if (currentChapter) {
      currentContent.push(line);
    }
  }

  // Save last chapter
  if (currentChapter) {
    currentChapter.content = currentContent.join('\n').trim();
    chapters.push(currentChapter as Chapter);
  }

  // If no chapters were found, treat entire content as a single chapter
  if (chapters.length === 0 && currentContent.length > 0) {
    chapters.push({
      title: 'Chapter 1',
      content: currentContent.join('\n').trim(),
      order: 0,
    });
  }

  return {
    title: title || 'Untitled Story',
    logline,
    chapters,
  };
}

/**
 * Reads a Markdown file and parses it
 * @param file The Markdown file
 * @returns Promise that resolves to parsed story data
 */
export async function importMarkdownFile(file: File): Promise<ParsedMarkdown> {
  const content = await file.text();
  return parseMarkdown(content);
}
