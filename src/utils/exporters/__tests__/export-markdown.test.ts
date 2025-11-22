/**
 * Unit tests for Markdown export functionality
 */

import { exportToMarkdown, exportChaptersToMarkdown, type StoryData, type Chapter } from '../export-markdown'

describe('Markdown Exporter', () => {
  describe('exportToMarkdown', () => {
    it('should export a basic story with title and logline', () => {
      const data: StoryData = {
        title: 'Test Story',
        logline: 'A compelling story about testing',
      }

      const result = exportToMarkdown(data)

      expect(result).toContain('# Test Story')
      expect(result).toContain('> A compelling story about testing')
    })

    it('should export chapters in correct order', () => {
      const data: StoryData = {
        title: 'Test Story',
        chapters: [
          { title: 'Chapter Two', content: 'Second chapter content', order: 2, wordCount: 10 },
          { title: 'Chapter One', content: 'First chapter content', order: 1, wordCount: 10 },
          { title: 'Chapter Three', content: 'Third chapter content', order: 3, wordCount: 10 },
        ],
      }

      const result = exportToMarkdown(data)

      const chapterOneIndex = result.indexOf('Chapter 1: Chapter One')
      const chapterTwoIndex = result.indexOf('Chapter 2: Chapter Two')
      const chapterThreeIndex = result.indexOf('Chapter 3: Chapter Three')

      expect(chapterOneIndex).toBeLessThan(chapterTwoIndex)
      expect(chapterTwoIndex).toBeLessThan(chapterThreeIndex)
    })

    it('should include chapter summaries when present', () => {
      const data: StoryData = {
        title: 'Test Story',
        chapters: [
          {
            title: 'Chapter One',
            summary: 'This is a chapter summary',
            content: 'Chapter content',
            order: 1,
          },
        ],
      }

      const result = exportToMarkdown(data)

      expect(result).toContain('*This is a chapter summary*')
    })

    it('should export outline items', () => {
      const data: StoryData = {
        title: 'Test Story',
        outline: [
          { title: 'Act 1', description: 'Setup', order: 1 },
          { title: 'Beat 1', description: 'Opening scene', order: 2, parentId: 'act1' },
        ],
      }

      const result = exportToMarkdown(data, true)

      expect(result).toContain('## Outline')
      expect(result).toContain('**Act 1**: Setup')
      expect(result).toContain('**Beat 1**: Opening scene')
    })

    it('should export character information', () => {
      const data: StoryData = {
        title: 'Test Story',
        characters: [
          {
            name: 'John Doe',
            role: 'Protagonist',
            description: 'A brave hero',
          },
        ],
      }

      const result = exportToMarkdown(data, true)

      expect(result).toContain('## Characters')
      expect(result).toContain('### John Doe (Protagonist)')
      expect(result).toContain('A brave hero')
    })

    it('should export world elements', () => {
      const data: StoryData = {
        title: 'Test Story',
        worldElements: [
          {
            name: 'The Kingdom',
            type: 'Location',
            description: 'A vast medieval kingdom',
          },
        ],
      }

      const result = exportToMarkdown(data, true)

      expect(result).toContain('## World Building')
      expect(result).toContain('### The Kingdom - Location')
      expect(result).toContain('A vast medieval kingdom')
    })

    it('should export timeline events', () => {
      const data: StoryData = {
        title: 'Test Story',
        timeline: [
          {
            title: 'The Great War',
            description: 'A major conflict',
            timeframe: 'Year 1000',
            category: 'Historical Event',
          },
        ],
      }

      const result = exportToMarkdown(data, true)

      expect(result).toContain('## Timeline')
      expect(result).toContain('### Year 1000: The Great War')
      expect(result).toContain('**Category**: Historical Event')
      expect(result).toContain('A major conflict')
    })

    it('should export notes', () => {
      const data: StoryData = {
        title: 'Test Story',
        notes: [
          {
            title: 'Research Note',
            content: 'Important research findings',
            category: 'Research',
          },
        ],
      }

      const result = exportToMarkdown(data, true)

      expect(result).toContain('## Notes')
      expect(result).toContain('### Research Note')
      expect(result).toContain('**Category**: Research')
      expect(result).toContain('Important research findings')
    })

    it('should exclude metadata when includeMetadata is false', () => {
      const data: StoryData = {
        title: 'Test Story',
        characters: [{ name: 'John', role: 'Hero', description: 'A hero' }],
        outline: [{ title: 'Act 1', description: 'Setup', order: 1 }],
      }

      const result = exportToMarkdown(data, false)

      expect(result).not.toContain('## Characters')
      expect(result).not.toContain('## Outline')
    })
  })

  describe('exportChaptersToMarkdown', () => {
    it('should export chapters without metadata', () => {
      const chapters: Chapter[] = [
        { title: 'First Chapter', content: 'Content 1', order: 1 },
        { title: 'Second Chapter', content: 'Content 2', order: 2 },
      ]

      const result = exportChaptersToMarkdown(chapters)

      expect(result).toContain('## Chapter 1: First Chapter')
      expect(result).toContain('## Chapter 2: Second Chapter')
      expect(result).toContain('Content 1')
      expect(result).toContain('Content 2')
    })

    it('should include title when provided', () => {
      const chapters: Chapter[] = [
        { title: 'First Chapter', content: 'Content', order: 1 },
      ]

      const result = exportChaptersToMarkdown(chapters, 'My Story')

      expect(result).toContain('# My Story')
    })

    it('should sort chapters by order', () => {
      const chapters: Chapter[] = [
        { title: 'Chapter Three', content: 'Content 3', order: 3 },
        { title: 'Chapter One', content: 'Content 1', order: 1 },
        { title: 'Chapter Two', content: 'Content 2', order: 2 },
      ]

      const result = exportChaptersToMarkdown(chapters)

      const chapterOneIndex = result.indexOf('Chapter 1')
      const chapterTwoIndex = result.indexOf('Chapter 2')
      const chapterThreeIndex = result.indexOf('Chapter 3')

      expect(chapterOneIndex).toBeLessThan(chapterTwoIndex)
      expect(chapterTwoIndex).toBeLessThan(chapterThreeIndex)
    })
  })
})
