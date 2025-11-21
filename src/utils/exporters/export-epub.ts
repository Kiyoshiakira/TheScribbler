/**
 * @fileoverview Export story content to EPUB format
 */

export interface Chapter {
  title: string;
  summary?: string;
  content: string;
  order: number;
  wordCount?: number;
}

export interface StoryData {
  title: string;
  logline?: string;
  chapters?: Chapter[];
  author?: string;
}

interface EpubOptions {
  title: string;
  author: string;
  chapters: Array<{
    title: string;
    content: string;
  }>;
  description?: string;
}

/**
 * Creates EPUB content structure from story data
 * @param data The story data to export
 * @param author Author name
 * @returns EPUB options object compatible with epub-gen-memory
 */
export function createEpubOptions(data: StoryData, author: string = 'Unknown Author'): EpubOptions {
  const epubChapters: Array<{ title: string; content: string }> = [];

  if (data.chapters && data.chapters.length > 0) {
    const sortedChapters = [...data.chapters].sort((a, b) => a.order - b.order);
    
    sortedChapters.forEach((chapter, index) => {
      let content = '';
      
      // Add chapter title
      content += `<h1>Chapter ${index + 1}: ${escapeHtml(chapter.title)}</h1>`;
      
      // Add summary if present
      if (chapter.summary) {
        content += `<p><em>${escapeHtml(chapter.summary)}</em></p>`;
      }
      
      // Convert chapter content to HTML paragraphs
      const paragraphs = chapter.content.split('\n').filter(p => p.trim());
      paragraphs.forEach(p => {
        content += `<p>${escapeHtml(p)}</p>`;
      });
      
      epubChapters.push({
        title: `Chapter ${index + 1}: ${chapter.title}`,
        content,
      });
    });
  }

  return {
    title: data.title,
    author,
    chapters: epubChapters,
    description: data.logline,
  };
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates EPUB content using epub-gen-memory
 * @param data Story data
 * @param author Author name
 * @returns Promise that resolves to EPUB buffer (Blob in browser)
 */
export async function generateEpub(data: StoryData, author: string = 'Unknown Author'): Promise<any> {
  // Use the browser bundle of epub-gen-memory which avoids Node.js dependencies
  const epubGen = (await import('epub-gen-memory/bundle')).default as any;
  
  const options = createEpubOptions(data, author);
  
  return epubGen(options);
}
