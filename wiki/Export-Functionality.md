# Export Functionality

ScriptScribbler supports multiple export formats for your screenplays. Each format is optimized for different use cases and maintains proper screenplay formatting standards.

## Export Methods

### How to Export

1. Click the **Export** button in the app header (top of screen)
2. Select your desired format from the dropdown menu
3. File is automatically downloaded (or print dialog opens for PDF)
4. Choose where to save the file on your computer

### Available from

Export functionality is available from:
- **Editor Tab**: Export while writing
- **Profile View**: Export from your script list
- **Dashboard**: Quick export from script cards

## Supported Export Formats

### 1. 📦 .scribbler (Native Format)

**Complete project backup and sharing format**

**Description:**
- ZIP archive containing JSON files
- Complete project export including all data

**Contents:**
- Script content (all blocks and formatting)
- Characters (profiles, descriptions, portraits)
- Scenes (metadata, descriptions, timing)
- Notes (all categories and content)
- Project metadata

**Use Cases:**
- ✅ Backup your entire project
- ✅ Share with other ScriptScribbler users
- ✅ Transfer projects between devices
- ✅ Version control and archiving

**Features:**
- Preserves all project data
- No data loss
- Easy re-import
- Portable format

**File Structure:**
```
screenplay.scribbler (ZIP)
├── script.json
├── characters.json
├── scenes.json
├── notes.json
└── metadata.json
```

---

### 2. 🎬 Fountain (.fountain)

**Industry-standard plain text markup language**

**Description:**
- Plain text with Fountain syntax
- Human-readable screenplay format
- Universal compatibility

**Use Cases:**
- ✅ Maximum compatibility with screenwriting software
- ✅ Import into Final Draft, Fade In, Highland, WriterDuet
- ✅ Version control friendly (Git, SVN)
- ✅ Edit in any text editor

**Features:**
- Supports all screenplay elements
- Includes sections and synopsis
- Centered text support
- Plain text = small file size
- Industry standard

**Compatible Software:**
- Final Draft
- Fade In
- Highland
- WriterDuet
- Celtx
- Any Fountain-compatible app

**Example Output:**
```fountain
INT. COFFEE SHOP - DAY

Sarah sits at a corner table.

SARAH
Hello, how are you?

JOHN
(smiling)
I'm doing well, thanks.

CUT TO:
```

---

### 3. 📄 Plain Text (.txt)

**Formatted screenplay with industry-standard indentation**

**Description:**
- Plain text with proper spacing
- Industry-standard indentation
- Ready for reading or printing

**Use Cases:**
- ✅ Reading and review
- ✅ Printing without software
- ✅ Import into word processors
- ✅ Email friendly format

**Formatting Standards:**
- Scene headings: Left-aligned, uppercase
- Character names: Indented 2.2 inches, uppercase
- Dialogue: Indented 1.5 inches
- Parentheticals: Indented 1.8 inches
- Transitions: Right-aligned, uppercase
- Centered text: Center-aligned

**Example Output:**
```
INT. COFFEE SHOP - DAY

Sarah sits at a corner table.

                    SARAH
          Hello, how are you?

                    JOHN
                 (smiling)
          I'm doing well, thanks.

                                        CUT TO:
```

---

### 4. 📋 Final Draft (.fdx)

**Final Draft XML format**

**Description:**
- Final Draft XML format (FDX version 5)
- Industry-standard professional format

**Use Cases:**
- ✅ Open in Final Draft 8 or later
- ✅ Professional submissions
- ✅ Studio standard format
- ✅ Production planning

**Features:**
- Industry-standard format
- Preserves screenplay structure
- Compatible with Final Draft ecosystem
- Includes title page and element settings
- Professional presentation

**Compatibility:**
- Final Draft 8+
- Final Draft 9+
- Final Draft 10+
- Final Draft 11+
- Final Draft 12+

**Technical Details:**
- XML-based format
- FDX version 5 specification
- Proper element type mappings
- Title page included
- Page settings preserved

---

### 5. 📑 PDF

**Print-ready screenplay PDF**

**Description:**
- Professional PDF format via browser print
- Industry-standard formatting
- Ready for submission or distribution

**Use Cases:**
- ✅ Sharing with producers, agents, readers
- ✅ Printing physical copies
- ✅ Professional submissions
- ✅ Portfolio presentation
- ✅ Contest submissions

**Format Specifications:**
- **Font**: 12pt Courier New
- **Page Size**: 8.5" x 11" (US Letter)
- **Margins**: 
  - Top: 1"
  - Bottom: 1"
  - Left: 1.5"
  - Right: 1"
- **Line Spacing**: Single-spaced (12pt)
- **Page Breaks**: Automatic and proper

**Features:**
- Industry-standard formatting
- Automatic page breaks
- Professional appearance
- Universal compatibility
- Print-ready quality

**How It Works:**
1. Click Export → PDF
2. Browser print dialog opens
3. Preview the formatted screenplay
4. Choose "Save as PDF" in print dialog
5. Select destination and save

**Tips for Best Results:**
- Use "Save as PDF" in print options
- Ensure margins are set to "Default"
- Disable headers and footers
- Use "Portrait" orientation
- 100% scale (no shrinking)

---

### 6. 📱 Google Docs

**Cloud-based editing and collaboration**

**Current Status:** Alternative methods provided

**Description:**
- Export guidance for Google Docs workflow
- Direct export requires OAuth 2.0 setup

**Current Implementation:**
- Export to Fountain or PDF
- Import Fountain into Google Docs
- Use PDF for sharing

**Future Feature:**
Direct Google Docs export will require:
- Google OAuth 2.0 configuration
- Documents API scope permissions
- One-click export to new Google Doc
- Proper screenplay formatting in Docs

**Use Cases:**
- ✅ Cloud-based editing
- ✅ Collaboration with multiple writers
- ✅ Comments and suggestions
- ✅ Version history

**Workaround:**
1. Export to Fountain (.fountain)
2. Import Fountain file into Google Docs
3. Or share PDF version for review

---

## Format Comparison

| Format | Best For | File Size | Editable | Import Back |
|--------|----------|-----------|----------|-------------|
| .scribbler | Backup, sharing | Medium | ✅ Yes | ✅ Yes |
| Fountain | Compatibility | Small | ✅ Yes | ⚠️ Script only |
| Plain Text | Reading | Small | ✅ Yes | ⚠️ Manual |
| Final Draft | Professional use | Medium | ✅ Yes | ⚠️ Script only |
| PDF | Submission, printing | Medium | ❌ No | ❌ No |
| Google Docs | Collaboration | N/A | ✅ Yes | ⚠️ Manual |

## Screenplay Elements Support

All export formats support the following screenplay elements:

✅ **Supported Elements:**
- Scene Headings (INT./EXT.)
- Action/Description
- Character Names
- Dialogue
- Parentheticals (actor directions)
- Transitions (CUT TO, FADE OUT, etc.)
- Centered Text (THE END, etc.)
- Section Headings (Act markers)
- Synopsis (scene summaries)

## Export Best Practices

### Before Exporting

1. **Proofread Your Script**: Use AI proofreading to catch errors
2. **Check Formatting**: Ensure proper Fountain syntax
3. **Review Scene Numbers**: Verify scene order
4. **Update Metadata**: Title, author, contact info
5. **Final Save**: Save your work before exporting

### Choosing the Right Format

**For Backup:**
- Use `.scribbler` (preserves everything)

**For Sharing with Writers:**
- Use `Fountain` (universal compatibility)

**For Submission:**
- Use `PDF` (professional standard)

**For Production:**
- Use `Final Draft` (.fdx) if required

**For Collaboration:**
- Use `Fountain` or `PDF` for Google Docs workflow

### After Exporting

1. **Verify Export**: Open exported file to check formatting
2. **Test Import**: If sharing, test import in target software
3. **Backup Original**: Keep your `.scribbler` file safe
4. **Version Control**: Name files with version numbers

## Export Troubleshooting

### Export Button Not Working

**Possible Issues:**
1. Script not saved
2. Browser blocking download
3. Network issues (for cloud exports)

**Solutions:**
1. Save script first (Ctrl/Cmd + S)
2. Check browser popup blocker settings
3. Try different browser
4. Check internet connection

### Formatting Issues in Exported File

**Common Problems:**
1. Missing scene headings
2. Incorrect indentation
3. Missing page breaks

**Solutions:**
1. Verify Fountain syntax in editor
2. Use "Fix Formatting" AI feature
3. Check for manual formatting errors
4. Re-export after fixing

### PDF Not Saving

**Possible Issues:**
1. Print dialog cancelled
2. Browser restrictions
3. Popup blocker

**Solutions:**
1. Complete print dialog (choose "Save as PDF")
2. Allow popups from ScriptScribbler
3. Use different browser
4. Try Fountain export instead

### File Won't Open in Target Software

**Possible Issues:**
1. Incompatible version
2. File corruption
3. Incorrect format chosen

**Solutions:**
1. Check software version requirements
2. Re-export from ScriptScribbler
3. Use Fountain as universal format
4. Contact support if persistent

## Technical Implementation

### Export Functions

Each export module provides a main export function:

```typescript
// Fountain Export
export function exportToFountain(scriptDoc: ScriptDocument, title?: string): string

// Plain Text Export
export function exportToPlainText(scriptDoc: ScriptDocument, title?: string): string

// Final Draft Export
export function exportToFinalDraft(scriptDoc: ScriptDocument, title?: string): string

// PDF Export
export async function exportToPDF(scriptDoc: ScriptDocument, title?: string): Promise<Blob>

// Native Format Export
export async function exportToScribbler(projectData: ProjectData): Promise<Blob>
```

### File Structure

Export utilities are located in:
```
src/lib/
├── export-fountain.ts      # Fountain format export
├── export-txt.ts            # Plain text export
├── export-fdx.ts            # Final Draft XML export
├── export-pdf.ts            # PDF export
└── export-google-docs.ts    # Google Docs utilities
```

## Future Export Features

Planned improvements:

- **Batch Export**: Export multiple formats at once
- **Custom Formatting**: User-defined export templates
- **Direct Google Docs Integration**: One-click export with OAuth
- **Highland Format**: Export to Highland 2 format
- **Export Statistics**: Include reports with exports
- **Scheduled Exports**: Automatic backups
- **Cloud Storage**: Direct export to Drive, Dropbox
- **Mobile Export**: Enhanced mobile export options

---

**Related Pages:**
- [Application Features](Application-Features) - Overview of all features
- [Fountain Guide](Fountain-Guide) - Learn screenplay syntax
- [Getting Started](Getting-Started) - Set up and start writing

---

**💡 Pro Tip:** Always keep a `.scribbler` backup of your project! It's the only format that preserves all your data (characters, scenes, notes).
