/**
 * @fileoverview Export story content to DOCX format
 */

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } from 'docx';

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
 * Exports story data to DOCX Document
 * @param data The story data to export
 * @param includeMetadata Whether to include outline, characters, and world-building
 * @returns DOCX Document instance
 */
export function createDocxDocument(data: StoryData, includeMetadata: boolean = true): Document {
  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Logline
  if (data.logline) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.logline,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      })
    );
  }

  // Page break before main content
  sections.push(
    new Paragraph({
      text: '',
      pageBreakBefore: true,
    })
  );

  // Metadata sections (optional)
  if (includeMetadata) {
    // Outline
    if (data.outline && data.outline.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Outline',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      const sortedOutline = [...data.outline].sort((a, b) => a.order - b.order);
      sortedOutline.forEach(item => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${item.title}: `,
                bold: true,
              }),
              new TextRun({
                text: item.description,
              }),
            ],
            spacing: { after: 100 },
            indent: {
              left: item.parentId ? convertInchesToTwip(0.5) : 0,
            },
          })
        );
      });

      sections.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // Characters
    if (data.characters && data.characters.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Characters',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      data.characters.forEach(char => {
        sections.push(
          new Paragraph({
            text: `${char.name} (${char.role})`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        // Split description into paragraphs
        const paragraphs = char.description.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          sections.push(
            new Paragraph({
              text: p,
              spacing: { after: 100 },
            })
          );
        });
      });

      sections.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // World Building
    if (data.worldElements && data.worldElements.length > 0) {
      sections.push(
        new Paragraph({
          text: 'World Building',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      data.worldElements.forEach(element => {
        sections.push(
          new Paragraph({
            text: `${element.name} - ${element.type}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        const paragraphs = element.description.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          sections.push(
            new Paragraph({
              text: p,
              spacing: { after: 100 },
            })
          );
        });
      });

      sections.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // Timeline
    if (data.timeline && data.timeline.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Timeline',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      data.timeline.forEach(event => {
        sections.push(
          new Paragraph({
            text: `${event.timeframe}: ${event.title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Category: ',
                bold: true,
              }),
              new TextRun({
                text: event.category,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        const paragraphs = event.description.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          sections.push(
            new Paragraph({
              text: p,
              spacing: { after: 100 },
            })
          );
        });
      });

      sections.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // Notes
    if (data.notes && data.notes.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Notes',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        })
      );

      data.notes.forEach(note => {
        sections.push(
          new Paragraph({
            text: note.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Category: ',
                bold: true,
              }),
              new TextRun({
                text: note.category,
              }),
            ],
            spacing: { after: 100 },
          })
        );

        const paragraphs = note.content.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          sections.push(
            new Paragraph({
              text: p,
              spacing: { after: 100 },
            })
          );
        });
      });

      sections.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }
  }

  // Chapters (main content)
  if (data.chapters && data.chapters.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Chapters',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 400 },
      })
    );

    const sortedChapters = [...data.chapters].sort((a, b) => a.order - b.order);
    sortedChapters.forEach((chapter, index) => {
      sections.push(
        new Paragraph({
          text: `Chapter ${index + 1}: ${chapter.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: index > 0,
        })
      );

      if (chapter.summary) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: chapter.summary,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      // Split chapter content into paragraphs
      const paragraphs = chapter.content.split('\n').filter(p => p.trim());
      paragraphs.forEach(p => {
        sections.push(
          new Paragraph({
            text: p,
            spacing: {
              after: 200,
              line: 360, // 1.5 line spacing
            },
          })
        );
      });
    });
  }

  return new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
}

/**
 * Creates a DOCX document from chapters only
 * @param chapters The chapters to export
 * @param title Optional story title
 * @returns DOCX Document instance
 */
export function createChaptersDocxDocument(chapters: Chapter[], title?: string): Document {
  const sections: Paragraph[] = [];

  if (title) {
    sections.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      })
    );

    sections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  sortedChapters.forEach((chapter, index) => {
    sections.push(
      new Paragraph({
        text: `Chapter ${index + 1}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: index > 0,
      })
    );

    if (chapter.summary) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: chapter.summary,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    const paragraphs = chapter.content.split('\n').filter(p => p.trim());
    paragraphs.forEach(p => {
      sections.push(
        new Paragraph({
          text: p,
          spacing: {
            after: 200,
            line: 360,
          },
        })
      );
    });
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
}
