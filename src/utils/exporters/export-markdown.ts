/**
 * @fileoverview Export story content to Markdown format
 */

export interface Chapter {
  title: string;
  summary?: string;
  content: string;
  order: number;
  wordCount?: number;
}

export interface OutlineItem {
  title: string;
  description: string;
  order: number;
  parentId?: string;
}

export interface StoryCharacter {
  name: string;
  role: string;
  description: string;
}

export interface WorldElement {
  name: string;
  type: string;
  description: string;
}

export interface TimelineEvent {
  title: string;
  description: string;
  timeframe: string;
  category: string;
}

export interface StoryNote {
  title: string;
  content: string;
  category: string;
}

export interface StoryData {
  title: string;
  logline?: string;
  chapters?: Chapter[];
  outline?: OutlineItem[];
  characters?: StoryCharacter[];
  worldElements?: WorldElement[];
  timeline?: TimelineEvent[];
  notes?: StoryNote[];
}

/**
 * Exports story data to Markdown format
 * @param data The story data to export
 * @param includeMetadata Whether to include outline, characters, and world-building
 * @returns Markdown formatted string
 */
export function exportToMarkdown(data: StoryData, includeMetadata: boolean = true): string {
  const lines: string[] = [];

  // Title and Logline
  lines.push(`# ${data.title}`);
  lines.push('');
  
  if (data.logline) {
    lines.push(`> ${data.logline}`);
    lines.push('');
  }

  // Metadata sections (optional)
  if (includeMetadata) {
    // Outline
    if (data.outline && data.outline.length > 0) {
      lines.push('## Outline');
      lines.push('');
      
      const sortedOutline = [...data.outline].sort((a, b) => a.order - b.order);
      sortedOutline.forEach(item => {
        const level = item.parentId ? '  -' : '-';
        lines.push(`${level} **${item.title}**: ${item.description}`);
      });
      lines.push('');
    }

    // Characters
    if (data.characters && data.characters.length > 0) {
      lines.push('## Characters');
      lines.push('');
      
      data.characters.forEach(char => {
        lines.push(`### ${char.name} (${char.role})`);
        lines.push('');
        lines.push(char.description);
        lines.push('');
      });
    }

    // World Building
    if (data.worldElements && data.worldElements.length > 0) {
      lines.push('## World Building');
      lines.push('');
      
      data.worldElements.forEach(element => {
        lines.push(`### ${element.name} - ${element.type}`);
        lines.push('');
        lines.push(element.description);
        lines.push('');
      });
    }

    // Timeline
    if (data.timeline && data.timeline.length > 0) {
      lines.push('## Timeline');
      lines.push('');
      
      data.timeline.forEach(event => {
        lines.push(`### ${event.timeframe}: ${event.title}`);
        lines.push('');
        lines.push(`**Category**: ${event.category}`);
        lines.push('');
        lines.push(event.description);
        lines.push('');
      });
    }

    // Notes
    if (data.notes && data.notes.length > 0) {
      lines.push('## Notes');
      lines.push('');
      
      data.notes.forEach(note => {
        lines.push(`### ${note.title}`);
        lines.push('');
        lines.push(`**Category**: ${note.category}`);
        lines.push('');
        lines.push(note.content);
        lines.push('');
      });
    }
  }

  // Chapters (main content)
  if (data.chapters && data.chapters.length > 0) {
    lines.push('## Chapters');
    lines.push('');
    
    const sortedChapters = [...data.chapters].sort((a, b) => a.order - b.order);
    sortedChapters.forEach((chapter, index) => {
      lines.push(`### Chapter ${index + 1}: ${chapter.title}`);
      lines.push('');
      
      if (chapter.summary) {
        lines.push(`*${chapter.summary}*`);
        lines.push('');
      }
      
      lines.push(chapter.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Exports only chapter content as a simple Markdown document
 * @param chapters The chapters to export
 * @param title Optional story title
 * @returns Markdown formatted string
 */
export function exportChaptersToMarkdown(chapters: Chapter[], title?: string): string {
  const lines: string[] = [];

  if (title) {
    lines.push(`# ${title}`);
    lines.push('');
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  sortedChapters.forEach((chapter, index) => {
    lines.push(`## Chapter ${index + 1}: ${chapter.title}`);
    lines.push('');
    
    if (chapter.summary) {
      lines.push(`*${chapter.summary}*`);
      lines.push('');
    }
    
    lines.push(chapter.content);
    lines.push('');
  });

  return lines.join('\n');
}
