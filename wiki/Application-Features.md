# Application Features

ScriptScribbler is your AI-powered screenwriting partner, designed to help you bring your stories to life. Our goal is to blend a powerful, clean writing environment with intelligent tools that assist you at every step of the creative process.

## Application Architecture

ScriptScribbler is a **single-page application (SPA)** with a **tabbed sidebar interface**. The main application uses tabs in the left sidebar to navigate between different views (Dashboard, Editor, Logline, Scenes, Characters, and Notes). Profile and Settings are accessible via the user menu in the top-right corner.

> 📖 **Learn More**: See [Application Architecture](Application-Architecture) for detailed information about the app structure.

## Main Application Tabs

Navigate between different aspects of your screenplay using the tabs in the left sidebar:

### 📊 Dashboard Tab
Your script management hub for organizing all your projects.

**Features:**
- Manage your scripts
- Create new projects
- Access recent work
- View script statistics
- Quick access to all your screenplays

### ✍️ Editor Tab
A professional full-featured screenplay editor that understands screenplay formatting.

**Features:**
- **Automatic Formatting**: Intelligently formats scene headings, actions, characters, dialogue, and transitions
- **Tab to Cycle**: Quickly cycle through element types with the `Tab` key
- **Script Statistics**: Track word count and estimated run time in the sidebar
- **Scene Blocks**: Scrite-like collapsible scenes for better organization
- **Find & Replace**: Powerful search functionality
- **Syntax Highlighting**: Visual feedback for different screenplay elements

> 📖 **Learn More**: See [Fountain Guide](Fountain-Guide) for detailed editor usage.

### 📝 Logline Tab
Craft compelling story summaries for your screenplay.

**Features:**
- Create and edit concise loglines
- AI-powered logline generation
- Save multiple logline variations
- Export loglines with your script

### 🎬 Scenes Tab
Organize your script into structured scenes with details and metadata.

**Features:**
- See an overview of all your scenes
- Reorder and manage your script's structure
- Edit scene metadata (setting, time, description)
- Track scene progression
- Beatboard view for visual organization

### 👥 Characters Tab
Define and manage character profiles with descriptions and portraits.

**Features:**
- Automatic character creation from dialogue
- Track how many scenes each character appears in
- AI-generated character profiles and portraits
- Character descriptions and details
- Independent persistence (characters persist even when removed from script)

> 📖 **Learn More**: See [Character Management](Character-Management) for detailed character system information.

### 📋 Notes Tab
A digital corkboard for all your ideas, research, and inspiration.

**Features:**
- Add production notes, ideas, and research
- Categorize notes by plot, character, theme, and more
- AI-powered note generation
- Organize and search your notes
- Keep all story elements in one place

### 👤 Profile & Settings
Access your profile and app settings via the user avatar menu in the top-right corner (not in the sidebar).

**Features:**
- User profile management
- Script portfolio
- Account settings
- Application preferences
- Sign out

## 🤖 AI-Powered Features

ScriptScribbler includes comprehensive AI tools to enhance your writing process:

### AI Chat Assistant
Have a conversation with your AI assistant from the Editor tab.

**Capabilities:**
- Make changes to your script
- Generate character ideas
- Answer questions about your story
- Brainstorm plot developments
- Analyze story structure

### Suggest Improvements
Get quick, actionable suggestions on how to improve a scene or sequence.

**Features:**
- Context-aware suggestions
- Scene-specific improvements
- Dialogue enhancement
- Action description refinement

### Deep Analysis
Receive a comprehensive breakdown of your script's elements.

**Analysis Includes:**
- Plot structure evaluation
- Character development feedback
- Dialogue assessment
- Pacing recommendations
- Constructive feedback for improvement

### Proofread Script
Let the AI scan your script for errors and issues.

**Checks For:**
- Formatting errors
- Spelling mistakes
- Grammar issues
- Continuity problems
- Industry standard compliance

### Generate Logline
Instantly create a compelling, one-sentence summary of your screenplay.

### Generate Characters & Notes
Use AI to quickly generate detailed character profiles or brainstorm ideas for your notes.

> 📖 **Learn More**: See [AI Editor Features](AI-Editor-Features) for detailed AI functionality.

## 📥 Import & Export

### Import Features

**Import Scripts from Multiple Sources:**
- **Scrite Import**: Import existing projects from `.scrite` files, including:
  - Script content
  - Characters
  - Scenes
  - Notes
- **ScriptScribbler Import**: Import `.scribbler` files (native format)
- **Import from Google Docs**: Directly import scripts from Google Docs with AI-powered formatting

### Export Features

**Export Your Work in Various Formats:**
- **`.scribbler`**: Complete project export (ZIP archive with JSON files)
- **PDF**: Print-ready screenplay with industry-standard formatting
- **Fountain**: Industry-standard plain text markup language
- **Final Draft (.fdx)**: Compatible with Final Draft 8 and later
- **Plain Text**: Formatted screenplay with proper indentation

> 📖 **Learn More**: See [Export Functionality](Export-Functionality) for detailed export options.

## 🌐 Public Sharing

Share your work with others via dedicated public sharing routes (outside the main app):

### Public Script Views
Share your scripts with others via public URLs.

**Features:**
- View scripts at `/user/{userId}/script/{scriptId}`
- Read-only access for non-owners
- Full script content visible
- Characters, scenes, and notes included

### Public User Profiles
View other users' profiles and their script portfolio at `/user/{userId}`.

**Features:**
- Showcase your work
- Browse other writers' portfolios
- Professional presentation
- Easy sharing with industry contacts

## 🗑️ Selective Deletion Control

When deleting a script from the Profile view, choose exactly what to remove:

**Deletion Options:**
- Script document itself
- All characters
- All scenes
- All notes
- Or any combination of the above

This granular control prevents accidental data loss and gives you full control over your project data.

## ⌨️ Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle through block types |
| `Enter` | Create new block after current |
| `Shift+Enter` | Add line break within current block |
| `Backspace` (at start) | Merge with previous block |
| `Ctrl/Cmd + F` | Find in script |
| `Ctrl/Cmd + S` | Save script (auto-saves already) |

## 🔒 Collaboration & Permissions

- **Public Access**: Scripts are readable by all authenticated users via public routes
- **Write Access**: Remains owner-only
- **Authentication**: Required for all access
- **Secure Storage**: Firebase-based data protection

## 🎨 Professional Formatting

ScriptScribbler automatically formats your screenplay according to industry standards:

- **12pt Courier Font**: Industry standard typeface
- **Proper Margins**: 1" top/bottom, 1.5" left, 1" right
- **Element Indentation**: Correct spacing for dialogue, character names, parentheticals
- **Page Breaks**: Automatic pagination
- **Scene Numbers**: Automatic scene numbering
- **Proper Spacing**: Industry-standard element spacing

---

**Ready to start writing?** Head to the [Getting Started](Getting-Started) guide or learn more about the [Fountain Guide](Fountain-Guide).
