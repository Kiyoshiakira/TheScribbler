# Markdown Editor Implementation for Story Scribbler

## Overview

This implementation adds a rich Markdown editor with live preview to TheScribbler's Story Scribbler tool, specifically for the Chapters tab.

## Components

### MarkdownEditor (`src/components/Editor/MarkdownEditor.tsx`)

A full-featured Markdown editor component with:

#### Features
- **Side-by-side layout**: Editor and preview displayed side by side
- **Live preview**: Real-time rendering of Markdown as you type
- **Scroll synchronization**: Editor and preview scroll together
- **Toolbar buttons**: Quick access to common formatting options
- **Fullscreen mode**: Toggle fullscreen for distraction-free writing
- **Toggle preview**: Show/hide the preview pane

#### Keyboard Shortcuts
- **Cmd/Ctrl + B**: Insert bold formatting (`**text**`)
- **Cmd/Ctrl + I**: Insert italic formatting (`_text_`)
- **Cmd/Ctrl + H**: Add/cycle heading levels (`#` through `######`)
- **Cmd/Ctrl + Shift + C**: Insert code block (` ```...``` `)
- **Cmd/Ctrl + P**: Toggle preview visibility

#### Props
```typescript
interface MarkdownEditorProps {
  value: string;              // Current Markdown content
  onChange: (value: string) => void;  // Callback when content changes
  placeholder?: string;       // Placeholder text
  className?: string;         // Additional CSS classes
  minHeight?: number;         // Minimum height in pixels (default: 400)
}
```

### MarkdownPreview (`src/components/Editor/MarkdownPreview.tsx`)

A safe Markdown preview component with:

#### Features
- **GitHub Flavored Markdown (GFM)**: Full support for GFM syntax
- **Sanitization**: Uses DOMPurify to prevent XSS attacks
- **Custom styling**: Enhanced rendering for various Markdown elements
- **Responsive images**: Images scale to fit container
- **External links**: Links open in new tab with proper security attributes

#### Supported Markdown Features
- **Headings**: `# H1` through `###### H6`
- **Bold**: `**bold**` or `__bold__`
- **Italic**: `*italic*` or `_italic_`
- **Code blocks**: ` ```language...``` ` with syntax highlighting placeholder
- **Inline code**: `` `code` ``
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Lists**: Ordered (`1. item`) and unordered (`- item`)
- **Tables**: GFM table syntax
- **Blockquotes**: `> quote`
- **Task lists**: `- [ ] task` or `- [x] done`
- **Strikethrough**: `~~strikethrough~~`
- **Line breaks**: Two spaces at end of line or `\`

#### Props
```typescript
interface MarkdownPreviewProps {
  content: string;    // Markdown content to render
  className?: string; // Additional CSS classes
}
```

## Integration

The Markdown editor is integrated into the Story Scribbler's Chapters tab (`src/components/views/story-tabs/chapters-tab.tsx`):

1. Replaced the plain `<Textarea>` with `<MarkdownEditor>`
2. Increased dialog width to accommodate side-by-side layout
3. Updated label to indicate Markdown support
4. Maintained existing AI assist and word count features

## Testing

### Manual Testing
1. Open the app and sign in
2. Navigate to Story Scribbler
3. Go to the Chapters tab
4. Create or edit a chapter
5. Test the following:
   - Type Markdown syntax and see it preview in real-time
   - Use toolbar buttons to insert formatting
   - Test keyboard shortcuts (Cmd/Ctrl+B, I, H, Shift+C, P)
   - Scroll the editor and verify preview scrolls in sync
   - Toggle fullscreen mode
   - Toggle preview visibility
   - Save and verify content is preserved

### Sample Markdown Content
```markdown
# Chapter One: The Beginning

This is a **bold** statement and this is *italic*.

## Setting the Scene

The story takes place in a `futuristic city`.

### Key Points
- First point with **emphasis**
- Second point with _italics_
- Third point with ~~strikethrough~~

### Tasks
- [x] Completed task
- [ ] Pending task

### Code Example
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```

### Quote
> "The best way to predict the future is to invent it." - Alan Kay

### Table
| Character | Role | Status |
|-----------|------|--------|
| Alice | Protagonist | Active |
| Bob | Antagonist | Active |

### Link
Visit [GitHub](https://github.com) for more information.
```

## Security

- **XSS Prevention**: All Markdown content is sanitized using DOMPurify before rendering
- **Safe rendering**: React-markdown handles content safely
- **External links**: Open in new tab with `rel="noopener noreferrer"` for security

## Dependencies

No new dependencies were added. The implementation uses existing packages:
- `react-markdown`: Markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `isomorphic-dompurify`: HTML sanitization

## Future Enhancements

Potential improvements for future versions:
- Syntax highlighting for code blocks (e.g., using Prism.js)
- Image upload and paste support
- Auto-save while editing
- Markdown templates/snippets
- Export chapter as Markdown file
- Dark mode optimized preview styling
- Markdown cheat sheet modal
