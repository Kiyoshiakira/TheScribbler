# Export Functionality Documentation

## Overview

The Scribbler now supports multiple intelligent export formats for both screenplays and stories. Each format is optimized for different use cases and maintains proper formatting standards.

## Supported Export Formats

### Script Scribbler Formats

#### 1. .scribbler (Native Format)
- **Description**: Complete script project export including script, characters, scenes, and notes
- **Format**: ZIP archive containing JSON files
- **Use Case**: Backup, sharing, or transferring script projects between devices
- **Features**: Preserves all script project data including metadata

#### 2. Fountain (.fountain)
- **Description**: Industry-standard plain text markup language for screenwriting
- **Format**: Plain text with Fountain syntax
- **Use Case**: Maximum compatibility with screenwriting software (Final Draft, Fade In, Highland, etc.)
- **Features**: 
  - Human-readable format
  - Version control friendly
  - Supports all screenplay elements (scenes, dialogue, action, transitions, etc.)
  - Includes sections, synopsis, and centered text

#### 3. Plain Text (.txt)
- **Description**: Formatted screenplay with industry-standard indentation
- **Format**: Plain text with spacing and indentation
- **Use Case**: Reading, printing, or importing into word processors
- **Features**:
  - Scene headings: Left-aligned, uppercase
  - Character names: Indented 2.2 inches, uppercase
  - Dialogue: Indented 1.5 inches
  - Parentheticals: Indented 1.8 inches
  - Transitions: Right-aligned, uppercase
  - Centered text: Center-aligned

#### 4. Final Draft (.fdx)
- **Description**: Final Draft XML format
- **Format**: XML (FDX version 5)
- **Use Case**: Opening in Final Draft or compatible software
- **Features**:
  - Industry-standard format
  - Preserves screenplay structure
  - Compatible with Final Draft 8 and later
  - Includes title page and element settings

#### 5. PDF
- **Description**: Print-ready screenplay PDF
- **Format**: PDF via browser print dialog
- **Use Case**: Sharing, printing, or submission
- **Features**:
  - Proper screenplay formatting
  - Standard 8.5" x 11" page size
  - 12pt Courier New font
  - Industry-standard margins (1" top/bottom, 1.5" left, 1" right)
  - Automatic page breaks

#### 6. Google Docs (Alternative Method)
- **Description**: Export guidance for Google Docs workflow
- **Current Implementation**: Provides instructions to use Fountain or PDF export
- **Use Case**: Cloud-based editing and collaboration
- **Note**: Direct Google Docs export requires OAuth 2.0 setup (code is ready for when OAuth is configured)

### Story Scribbler Formats

#### 1. .story (Native Story Format)
- **Description**: Complete story project export including all story elements
- **Format**: ZIP archive containing JSON files
- **Use Case**: Backup, sharing, or transferring story projects between devices
- **Features**: 
  - Preserves all story project data
  - Includes outline, chapters, story characters, world building, timeline, and story notes
  - Separate from screenplay data for clean organization
  - Can be imported back into any Story Scribbler project

**Story File Contents**:
- `project.json`: Story title, logline, and content
- `outline.json`: Hierarchical story structure
- `chapters.json`: Chapter content with word counts
- `storyCharacters.json`: Character profiles with roles and descriptions
- `worldBuilding.json`: Locations, cultures, technologies, and world elements
- `timeline.json`: Story timeline with events and categories
- `storyNotes.json`: Organized notes with categories and tags
- `meta.json`: Export metadata and version information

## Implementation Details

### File Structure

```
src/lib/
├── export-fountain.ts      # Fountain format export
├── export-txt.ts            # Plain text export
├── export-fdx.ts            # Final Draft XML export
├── export-pdf.ts            # PDF export
└── export-google-docs.ts    # Google Docs export utilities
```

### Export Functions

Each export module provides a main export function:

```typescript
// Fountain
export function exportToFountain(scriptDoc: ScriptDocument, title?: string): string

// Plain Text
export function exportToPlainText(scriptDoc: ScriptDocument, title?: string): string

// Final Draft
export function exportToFinalDraft(scriptDoc: ScriptDocument, title?: string): string

// PDF
export async function exportToPDF(scriptDoc: ScriptDocument, title?: string): Promise<Blob>

// Google Docs (requires OAuth token)
export async function exportToGoogleDocs(
  scriptDoc: ScriptDocument,
  title: string,
  accessToken: string
): Promise<string>
```

### Screenplay Block Types Supported

All export formats support the following screenplay elements:

- **Scene Headings**: INT./EXT. locations
- **Action**: Description and stage directions
- **Character**: Speaker names
- **Dialogue**: Character speech
- **Parenthetical**: Actor directions in dialogue
- **Transition**: Scene transitions (CUT TO, FADE OUT, etc.)
- **Centered**: Centered text (THE END, etc.)
- **Section**: Act/section headings
- **Synopsis**: Scene summaries

## Usage in the Application

### Script Scribbler Export

Users can export their screenplay by:

1. Switch to **Script Scribbler** mode (if not already in it)
2. Click the **Export** button in the app header
3. Select desired format from the dropdown menu:
   - Export as .scribbler (native format)
   - Export as Fountain
   - Export as Plain Text (.txt)
   - Export as Final Draft (.fdx)
   - Export as PDF
   - Export to Google Docs (Alternative)
4. File is automatically downloaded or print dialog opens (for PDF)

### Story Scribbler Export

Users can export their story by:

1. Switch to **Story Scribbler** mode using the tool selector
2. Click the **Export** button in the app header
3. Select "Export as .story"
4. Story file is automatically downloaded with all story data

### Importing Files

**For Scripts**:
- File types: `.scrite`, `.scribbler`
- Contains: Script content, characters, scenes, notes

**For Stories**:
- File type: `.story`
- Contains: Story content, outline, chapters, story characters, world building, timeline, story notes

### Switching Between Tools

The application supports working on the same project in both tools:
- Each project can have both screenplay data AND story data
- Switch between Script Scribbler and Story Scribbler using the tool selector
- Dashboard shows relevant data based on current tool
- Export the appropriate data using the context-aware export options

## Technical Notes

### PDF Export
- Uses browser's native print functionality
- Creates a hidden iframe with formatted HTML
- Opens print dialog for user to save as PDF
- No server-side processing required

### Google Docs Export
- Requires Google OAuth 2.0 with `https://www.googleapis.com/auth/documents` scope
- Uses Google Docs API v1
- Creates properly formatted document with screenplay styling
- Current implementation provides alternative export methods until OAuth is configured

### Formatting Standards
All exports follow industry-standard screenplay formatting:
- 12pt Courier or Courier New font (where applicable)
- Proper indentation for dialogue, character names, and parentheticals
- Scene headings in uppercase
- Standard page margins for print formats

## Testing

Comprehensive tests verify:
- All block types are correctly formatted
- Structure is preserved across formats
- Special characters are properly escaped
- Output is valid for each format (XML validation for FDX, etc.)

## Future Enhancements

Potential improvements:
1. Batch export (multiple formats at once)
2. Export with custom formatting options
3. Direct Google Docs integration with OAuth
4. Export to Highland format
5. Export statistics and reports
