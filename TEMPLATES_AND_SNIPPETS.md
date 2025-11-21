# Templates and Snippets Feature

This document describes the Templates and Snippets feature added to The Scribbler.

## Overview

The Templates and Snippets feature accelerates drafting by providing structured starting points (templates) and reusable text blocks (snippets) with placeholder support.

## Templates

### What are Templates?

Templates are pre-configured document structures for common formats like short stories, blog posts, chapter layouts, etc. They help writers get started quickly with a well-structured document.

### Available Templates

1. **Short Story** - Basic short story template with title and author
2. **Blog Post** - Blog post template with introduction, content, and conclusion sections
3. **Chapter Layout** - Novel chapter template with chapter number and title
4. **Screenplay Scene** - Basic screenplay scene template
5. **Character Profile** - Character development template
6. **World Building Entry** - Template for creating world building elements

### Using Templates

1. Go to the Dashboard
2. Click the "Start with Template" button
3. Select a template from the picker dialog
4. Fill in the placeholders (e.g., {{Title}}, {{Author}})
5. Click "Apply Template" to create a new document

### Template Placeholders

Templates use the `{{PlaceholderName}}` syntax for dynamic content. When you select a template, you'll be prompted to fill in values for each placeholder before the document is created.

## Snippets

### What are Snippets?

Snippets are reusable text blocks that can be inserted into your document. They're perfect for frequently used content like scene descriptions, character actions, or formatting patterns.

### Storage

Snippets are stored in two ways:
- **Local Storage**: Available offline, stored in your browser
- **Cloud Storage** (Firestore): Synced across devices when logged in

### Managing Snippets

Access the Snippet Manager from the Editor toolbar by clicking the "Snippets" button.

#### Creating a Snippet

1. Click "New Snippet" in the Snippet Manager
2. Enter a name and description
3. Add your content (use `{{PlaceholderName}}` for dynamic parts)
4. Click "Create"

#### Editing a Snippet

1. Open the Snippet Manager
2. Click the edit icon on the snippet you want to modify
3. Make your changes
4. Click "Update"

#### Deleting a Snippet

1. Open the Snippet Manager
2. Click the delete icon on the snippet
3. Confirm the deletion

#### Inserting a Snippet

1. Open the Snippet Manager
2. Click "Insert" on the snippet you want to use
3. If the snippet has placeholders, fill them in
4. Click "Insert" to add the snippet to your document

### Snippet Placeholders

Like templates, snippets support placeholders using `{{PlaceholderName}}` syntax. When inserting a snippet with placeholders, you'll be prompted to provide values.

Example:
```
{{Character}} enters the room and says:

{{Character}}
{{Dialogue}}
```

When inserting, you'll be asked to provide values for `{{Character}}` and `{{Dialogue}}`.

## Technical Implementation

### File Structure

```
src/
├── data/
│   └── templates/
│       ├── types.ts              # Type definitions
│       ├── defaultTemplates.ts   # Default template configurations
│       └── index.ts              # Exports
├── components/
│   ├── Templates/
│   │   ├── TemplatesPicker.tsx   # Template selection UI
│   │   └── index.ts
│   └── Snippets/
│       ├── SnippetManager.tsx    # Snippet management UI
│       └── index.ts
```

### Key Components

- **TemplatesPicker**: Dialog component for selecting and customizing templates
- **SnippetManager**: Dialog component for managing snippets (CRUD operations)

### Integration Points

- **Dashboard**: Template picker integrated with "Start with Template" button
- **Editor**: Snippet manager accessible from toolbar

### Data Storage

- Templates: Static data in `src/data/templates/defaultTemplates.ts`
- Snippets: 
  - Local: Browser localStorage (`scribbler-snippets` key)
  - Cloud: Firestore collection at `users/{userId}/snippets`

## Future Enhancements

Potential improvements for future versions:

1. Custom template creation by users
2. Template sharing and community templates
3. Template categories and tags
4. Snippet organization with folders/tags
5. Import/export snippets
6. Snippet variables with default values
7. Rich text formatting in snippets
8. Keyboard shortcuts for quick snippet insertion
