# Wiki Setup Instructions

This repository now includes a complete, organized wiki structure in the `/wiki` directory.

## 📚 What's Included

The wiki contains **16 comprehensive pages** organized into clear categories:

### Getting Started (4 pages)
- **Home.md** - Wiki homepage with logo and navigation
- **Quick-Start-Guide.md** - 5-minute getting started guide
- **Getting-Started.md** - Detailed installation and setup instructions
- **Troubleshooting.md** - Common issues and solutions

### User Guides (5 pages)
- **Application-Features.md** - Complete overview of all features
- **Fountain-Guide.md** - Comprehensive screenplay formatting guide
- **Character-Management.md** - Character system documentation
- **AI-Editor-Features.md** - AI-powered tools and features
- **Export-Functionality.md** - Export formats and usage guide

### Architecture & Development (4 pages)
- **Application-Architecture.md** - Technical architecture overview
- **Implementation-Overview.md** - Recent implementations and features
- **Development-Blueprint.md** - Project vision and design guidelines
- **Development-Tasks.md** - Planned improvements and tasks

### Navigation & Documentation (3 pages)
- **_Sidebar.md** - Wiki sidebar navigation structure
- **README.md** - Wiki documentation and usage guide
- **LOGO_INSTRUCTIONS.md** - How to add your logo

## 🚀 How to Set Up the Wiki

### Option 1: Via Git (Recommended)

```bash
# 1. Clone the wiki repository
git clone https://github.com/Kiyoshiakira/ScriptScribblerFS.wiki.git
cd ScriptScribblerFS.wiki

# 2. Copy all wiki files
cp /path/to/ScriptScribblerFS/wiki/*.md .

# 3. Add your logo.png
cp /path/to/your/logo.png .

# 4. Commit and push
git add .
git commit -m "Add organized wiki documentation with logo"
git push origin master
```

### Option 2: Via GitHub Web Interface

1. **Enable Wiki** (if not already enabled)
   - Go to repository Settings
   - Check "Wikis" under Features
   - Save changes

2. **Navigate to Wiki**
   - Click the "Wiki" tab in your repository
   - You'll see a welcome page or existing wiki

3. **Create Home Page**
   - Click "Create the first page" or "Edit"
   - Copy content from `wiki/Home.md`
   - Save as "Home"

4. **Add Remaining Pages**
   - Click "New Page" for each page
   - Copy content from corresponding `.md` file
   - Save with the exact same name (e.g., "Quick-Start-Guide")

5. **Add Sidebar**
   - Create a new page named "_Sidebar"
   - Copy content from `wiki/_Sidebar.md`
   - Save

6. **Upload Logo**
   - Edit the Home page
   - Drag and drop your `logo.png` image
   - GitHub will upload it automatically
   - Save the page

## 🎨 About the Logo

The wiki is designed to display your logo at the top of the Home page.

### Logo Requirements
- **Filename**: Must be exactly `logo.png`
- **Format**: PNG (recommended for transparency)
- **Size**: 400-800px width recommended
- **Aspect Ratio**: 16:9 or 2:1 works well
- **Location**: Root of wiki repository

### I'll Make the Logo
As mentioned in the issue: "I'll make the logo, you put in the code, and I'll just change the logo name to logo.png"

Once you create your logo:
1. Name it exactly `logo.png`
2. Add it to the wiki repository
3. It will automatically appear on the Home page

## 📋 Wiki Structure

```
Wiki Pages Hierarchy:

Home (with logo)
│
├─ Getting Started
│  ├─ Quick Start Guide (5-minute guide)
│  ├─ Getting Started (detailed setup)
│  └─ Troubleshooting (common issues)
│
├─ User Guides
│  ├─ Application Features (all features)
│  ├─ Fountain Guide (formatting syntax)
│  ├─ Character Management (character system)
│  ├─ AI Editor Features (AI tools)
│  └─ Export Functionality (export formats)
│
└─ Architecture & Development
   ├─ Application Architecture (technical overview)
   ├─ Implementation Overview (recent changes)
   ├─ Development Blueprint (project vision)
   └─ Development Tasks (future improvements)
```

## ✨ Features of This Wiki

1. **Comprehensive Coverage**: All MD file content organized and enhanced
2. **Clear Navigation**: Sidebar makes finding information easy
3. **Professional Design**: Well-formatted with tables, code blocks, emojis
4. **Cross-References**: Pages link to related content
5. **Visual Appeal**: Logo at top, consistent formatting
6. **Progressive Learning**: Start simple, go deeper as needed
7. **Search-Friendly**: GitHub wiki has built-in search
8. **Mobile-Friendly**: Responsive design works on all devices

## 📊 Content Summary

### Total Content
- **16 wiki pages**
- **~135,000 words**
- **Comprehensive documentation**
- **User guides, technical docs, troubleshooting**

### Key Improvements Made
- ✅ Consolidated all MD files into organized structure
- ✅ Added Quick Start Guide for new users
- ✅ Enhanced with formatting, tables, code blocks
- ✅ Added cross-references between pages
- ✅ Created clear navigation hierarchy
- ✅ Added emoji icons for visual appeal
- ✅ Included troubleshooting guide
- ✅ Professional formatting throughout

## 🔄 Updating the Wiki

### To Update Content
1. Edit files in `/wiki` directory
2. Copy updated files to wiki repository
3. Commit and push changes

### To Add New Pages
1. Create new `.md` file in `/wiki`
2. Add link to Home.md navigation
3. Update `_Sidebar.md` if needed
4. Copy to wiki repository

## 📝 File Mapping

Original files have been organized as follows:

| Original File | Wiki Page |
|--------------|-----------|
| README.md | Getting-Started.md |
| FOUNTAIN_GUIDE.md | Fountain-Guide.md |
| IMPLEMENTATION_SUMMARY.md | Implementation-Overview.md |
| IMPLEMENTATION_NOTES.md | Implementation-Overview.md |
| CHARACTER_MANAGEMENT_FIX_SUMMARY.md | Implementation-Overview.md |
| ARCHITECTURE_CLARIFICATION.md | Application-Architecture.md |
| SIDEBAR_ORGANIZATION_FIX.md | Implementation-Overview.md |
| docs/CHARACTER_MANAGEMENT.md | Character-Management.md |
| docs/AI_EDITOR_FEATURES.md | AI-Editor-Features.md |
| docs/AI_EDITOR_IMPLEMENTATION.md | AI-Editor-Features.md |
| docs/EXPORT_FUNCTIONALITY.md | Export-Functionality.md |
| docs/blueprint.md | Development-Blueprint.md |
| docs/copilot-tasks.md | Development-Tasks.md |
| docs/nextsteps.md | Development-Tasks.md |
| docs/editorimprovements.md | Development-Tasks.md |
| docs/import-error-debug.md | Troubleshooting.md |
| public/APP_FEATURES.md | Application-Features.md |

## 🎯 Next Steps

1. **Review the wiki content** in `/wiki` directory
2. **Create your logo** (logo.png)
3. **Set up the wiki** using one of the methods above
4. **Add your logo** to the wiki repository
5. **Share the wiki** with users and contributors

## 💡 Tips

- The wiki will be accessible at: `https://github.com/Kiyoshiakira/ScriptScribblerFS/wiki`
- Use the sidebar for easy navigation
- Search functionality helps users find information quickly
- Update the wiki when adding new features
- Keep troubleshooting guide current with user feedback

## 📧 Questions?

If you need help or have suggestions, please open an issue on the repository.

---

**Wiki Created:** 2025-11-10
**Total Pages:** 16
**Ready for:** Logo addition and deployment

🎉 **Your wiki is ready! Just add your logo and deploy!**
