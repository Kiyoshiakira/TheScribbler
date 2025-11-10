# ScriptScribbler Wiki Content

This directory contains the organized documentation for the ScriptScribbler GitHub Wiki.

## 📁 Wiki Pages

### Getting Started
- **Home.md** - Wiki home page with logo and navigation
- **Quick-Start-Guide.md** - 5-minute getting started guide
- **Getting-Started.md** - Detailed installation and setup
- **Troubleshooting.md** - Common issues and solutions

### User Guides
- **Application-Features.md** - Complete feature overview
- **Fountain-Guide.md** - Screenplay formatting syntax guide
- **Character-Management.md** - Character system documentation
- **AI-Editor-Features.md** - AI-powered tools guide
- **Export-Functionality.md** - Export formats and usage

### Architecture & Development
- **Application-Architecture.md** - Technical architecture overview
- **Implementation-Overview.md** - Recent implementations
- **Development-Blueprint.md** - Project vision and guidelines
- **Development-Tasks.md** - Planned improvements and tasks

### Navigation
- **_Sidebar.md** - Wiki sidebar navigation structure

## 🚀 How to Use

### Setting Up the Wiki

1. **Access the Wiki Repository**
   ```bash
   git clone https://github.com/Kiyoshiakira/ScriptScribblerFS.wiki.git
   cd ScriptScribblerFS.wiki
   ```

2. **Copy Wiki Files**
   ```bash
   # Copy all files from this wiki directory to the wiki repository
   cp /path/to/ScriptScribblerFS/wiki/*.md .
   ```

3. **Add Logo**
   ```bash
   # Add your logo.png to the wiki repository root
   cp /path/to/your/logo.png .
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add organized wiki documentation with logo"
   git push origin master
   ```

### Alternative: Manual Upload via GitHub UI

1. Go to https://github.com/Kiyoshiakira/ScriptScribblerFS/wiki
2. Click "New Page" for each wiki page
3. Copy content from each `.md` file
4. Save each page
5. Upload logo.png via the wiki interface

## 📝 Wiki Structure

```
ScriptScribblerFS.wiki/
├── Home.md                          # Wiki home with logo and nav
├── _Sidebar.md                      # Sidebar navigation
├── logo.png                         # ScriptScribbler logo (you provide)
│
├── Getting Started/
│   ├── Quick-Start-Guide.md        # 5-minute guide
│   ├── Getting-Started.md          # Detailed setup
│   └── Troubleshooting.md          # Common issues
│
├── User Guides/
│   ├── Application-Features.md     # All features
│   ├── Fountain-Guide.md           # Syntax guide
│   ├── Character-Management.md     # Character system
│   ├── AI-Editor-Features.md       # AI tools
│   └── Export-Functionality.md     # Export formats
│
└── Architecture & Development/
    ├── Application-Architecture.md # Technical overview
    ├── Implementation-Overview.md  # Recent changes
    ├── Development-Blueprint.md    # Project vision
    └── Development-Tasks.md        # Future tasks
```

## 🎨 Logo Requirements

The wiki expects a logo file named **logo.png** in the root of the wiki repository.

**Recommendations:**
- Format: PNG (supports transparency)
- Size: 400-800px width recommended
- Aspect ratio: 16:9 or 2:1 works well
- Background: Transparent or matching theme
- File name: Must be exactly `logo.png`

**Placement:**
The logo appears at the top of the Home.md page using:
```markdown
![ScriptScribbler Logo](logo.png)
```

## 🔄 Updating the Wiki

### To Update Content

1. Edit the `.md` files in this `wiki/` directory
2. Copy updated files to the wiki repository
3. Commit and push changes

### To Add New Pages

1. Create new `.md` file in this directory
2. Add link to `Home.md` navigation
3. Add to `_Sidebar.md` if needed
4. Copy to wiki repository

### To Update Navigation

Edit `_Sidebar.md` to modify the sidebar structure.

## 📚 Wiki Features

### Cross-References
Wiki pages link to each other using:
```markdown
[Link Text](Page-Name)
```

### Images
Images can be embedded using:
```markdown
![Alt Text](image-name.png)
```

### Code Blocks
Code is formatted with syntax highlighting:
````markdown
```bash
npm run dev
```
````

### Tables
Tables organize information clearly:
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## 🎯 Content Organization

### By User Type

**For New Users:**
1. Home → Quick Start Guide → Getting Started
2. Application Features → Fountain Guide

**For Writers:**
1. Fountain Guide
2. Character Management
3. AI Editor Features
4. Export Functionality

**For Developers:**
1. Application Architecture
2. Development Blueprint
3. Development Tasks
4. Implementation Overview

### Navigation Flow

```
Home
├── Getting Started
│   ├── Quick Start (for beginners)
│   ├── Installation (detailed setup)
│   └── Troubleshooting (when stuck)
├── User Guides
│   ├── Features (what can I do?)
│   ├── Fountain Guide (how to format?)
│   ├── Characters (how do characters work?)
│   ├── AI Tools (what AI features exist?)
│   └── Export (how to export?)
└── Development
    ├── Architecture (how is it built?)
    ├── Implementation (what's new?)
    ├── Blueprint (what's the vision?)
    └── Tasks (what's next?)
```

## ✨ Benefits of This Organization

1. **Clear Navigation**: Sidebar makes finding information easy
2. **Progressive Disclosure**: Start simple, go deeper as needed
3. **Cross-Referencing**: Pages link to related content
4. **Visual Appeal**: Logo and formatting create professional look
5. **Searchable**: GitHub wiki has built-in search
6. **Version Control**: Wiki is a git repository
7. **Collaborative**: Easy for team members to update

## 🛠️ Maintenance

### Regular Updates Needed

- ✅ Update when features are added
- ✅ Keep troubleshooting guide current
- ✅ Add new development tasks
- ✅ Update screenshots if UI changes

### Content Review

- Review quarterly for accuracy
- Update outdated information
- Add new troubleshooting items
- Incorporate user feedback

## 📧 Questions?

If you need help with the wiki setup or have suggestions for improvements, please open an issue on the main repository.

---

**Last Updated:** 2025-11-10
**Maintained By:** ScriptScribbler Team
