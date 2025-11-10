# Logo Instructions

## 📷 Add Your Logo

The wiki is set up to display a logo at the top of the Home page. You need to provide the logo file.

### Steps to Add Logo

1. **Create or locate your logo file**
   - File name: **logo.png**
   - Format: PNG (recommended for transparency)
   - Size: 400-800px width recommended

2. **Add to wiki repository**
   ```bash
   # Clone the wiki repository
   git clone https://github.com/Kiyoshiakira/ScriptScribblerFS.wiki.git
   cd ScriptScribblerFS.wiki
   
   # Copy your logo
   cp /path/to/your/logo.png .
   
   # Commit and push
   git add logo.png
   git commit -m "Add ScriptScribbler logo"
   git push origin master
   ```

3. **Alternative: Upload via GitHub**
   - Go to the wiki page
   - Edit Home page
   - Drag and drop logo.png image
   - GitHub will upload and link it automatically

### Logo Specifications

**Recommended:**
- **Format**: PNG with transparency
- **Width**: 400-800 pixels
- **Height**: 100-200 pixels (or proportional)
- **Aspect Ratio**: 16:9 or 2:1 works well
- **File Size**: Under 500KB
- **Background**: Transparent or white

**Design Tips:**
- Keep it simple and recognizable
- Use ScriptScribbler brand colors (Deep Blue #3F51B5, Teal #009688)
- Include app name or icon
- Ensure readability at small sizes
- Test on both light and dark backgrounds

### Current Logo Reference

The Home.md page references the logo with:
```markdown
![ScriptScribbler Logo](logo.png)
```

Once you add `logo.png` to the wiki repository, it will display automatically!

---

**Note:** Until you add the logo, the Home page will show a broken image icon. This is normal and will be fixed once you upload your logo.png file.
