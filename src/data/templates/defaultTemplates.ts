import { Template } from './types';

/**
 * Default templates for common writing formats
 */
export const defaultTemplates: Template[] = [
  {
    id: 'short-story',
    name: 'Short Story',
    description: 'A basic short story template with title and author',
    category: 'story',
    content: `# {{Title}}

By {{Author}}

---

## Part 1

{{Content}}

---

*The End*`,
    placeholders: ['Title', 'Author', 'Content'],
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'A blog post template with title, author, and introduction',
    category: 'general',
    content: `# {{Title}}

*By {{Author}} | {{Date}}*

## Introduction

{{Introduction}}

## Main Content

{{Content}}

## Conclusion

{{Conclusion}}

---

*Tags: {{Tags}}*`,
    placeholders: ['Title', 'Author', 'Date', 'Introduction', 'Content', 'Conclusion', 'Tags'],
  },
  {
    id: 'chapter-layout',
    name: 'Chapter Layout',
    description: 'A novel chapter template with chapter number and title',
    category: 'story',
    content: `# Chapter {{ChapterNumber}}: {{ChapterTitle}}

{{Content}}

---

*End of Chapter {{ChapterNumber}}*`,
    placeholders: ['ChapterNumber', 'ChapterTitle', 'Content'],
  },
  {
    id: 'screenplay-scene',
    name: 'Screenplay Scene',
    description: 'A basic screenplay scene template',
    category: 'script',
    content: `{{SceneHeading}}

{{OpeningAction}}

{{Character}}
{{Dialogue}}

{{ClosingAction}}`,
    placeholders: ['SceneHeading', 'OpeningAction', 'Character', 'Dialogue', 'ClosingAction'],
  },
  {
    id: 'character-profile',
    name: 'Character Profile',
    description: 'A character development template',
    category: 'general',
    content: `# Character Profile: {{CharacterName}}

## Basic Information
- **Name:** {{CharacterName}}
- **Age:** {{Age}}
- **Occupation:** {{Occupation}}

## Physical Description
{{PhysicalDescription}}

## Personality
{{Personality}}

## Background
{{Background}}

## Goals and Motivations
{{Goals}}

## Conflicts
{{Conflicts}}`,
    placeholders: ['CharacterName', 'Age', 'Occupation', 'PhysicalDescription', 'Personality', 'Background', 'Goals', 'Conflicts'],
  },
  {
    id: 'world-building',
    name: 'World Building Entry',
    description: 'A template for creating world building elements',
    category: 'story',
    content: `# {{ElementName}}

## Type
{{ElementType}}

## Description
{{Description}}

## History
{{History}}

## Significance
{{Significance}}

## Related Elements
{{RelatedElements}}`,
    placeholders: ['ElementName', 'ElementType', 'Description', 'History', 'Significance', 'RelatedElements'],
  },
];
