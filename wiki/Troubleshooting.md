# Troubleshooting Guide

Common issues and solutions for ScriptScribbler. If you're experiencing problems, check here first!

## Login & Authentication Issues

### Cannot Sign In / Login Fails

**Symptoms:**
- Login button doesn't work
- Error: `(auth/invalid-credential)`
- Error: `(auth/operation-not-allowed)`
- Google 403 error page

**Common Causes & Solutions:**

#### 1. Sign-in Methods Not Enabled in Firebase

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build > Authentication**
4. Click **Sign-in method** tab
5. Enable both **Email/Password** and **Google** providers
6. Toggle each one ON and save

#### 2. Development Domain Not Authorized for Google Sign-In

**Solution:**
1. In Firebase Console, go to **Authentication > Sign-in method**
2. Scroll to **Authorized domains** section
3. Click **Add domain**
4. Add your domain:
   - Local: `localhost`
   - Cloud workspace: Copy from browser address bar (e.g., `xyz.cloudworkstations.dev`)
5. Click **Add** to save

#### 3. Incorrect Environment Variables

**Solution:**
1. Check `.env.local` file exists in project root
2. Verify all Firebase variables are set correctly:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```
3. Restart development server after changing variables
4. Clear browser cache and try again

---

## Editor Issues

### Editor Tab Not Loading / Blank Screen

**Symptoms:**
- Editor shows blank white screen
- Editor tab doesn't display
- Spinning loader never stops

**Common Causes & Solutions:**

#### 1. Firestore Permission Errors

**Solution:**
1. Check browser console for errors (F12)
2. Look for: `FirebaseError: Missing or insufficient permissions`
3. Verify Firestore rules allow authenticated users to read/write
4. Deploy updated `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

#### 2. Script Not Loading from Database

**Solution:**
1. Open browser console (F12)
2. Check for network errors
3. Verify script exists in Firestore database
4. Try creating a new script
5. Check Firebase console for script data

#### 3. JavaScript Errors

**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Clear browser cache (Ctrl/Cmd + Shift + Delete)
4. Hard refresh (Ctrl/Cmd + Shift + R)
5. Try different browser

#### 4. Authentication State Issues

**Solution:**
1. Sign out completely
2. Clear browser cache and cookies
3. Sign in again
4. If problem persists, check Firebase Authentication settings

---

### Editor Saving Issues

**Symptoms:**
- Changes not saving
- "Save failed" message
- Auto-save not working

**Solutions:**

#### Check Internet Connection
1. Verify you're online
2. Check Firebase status: [status.firebase.google.com](https://status.firebase.google.com)

#### Verify Firestore Rules
1. Check rules allow writes for authenticated users
2. Deploy latest `firestore.rules`

#### Clear Browser Cache
1. Clear cache and cookies
2. Reload application
3. Try saving again

---

## AI Features Issues

### AI Features Not Working

**Symptoms:**
- AI buttons disabled or greyed out
- "AI unavailable" messages
- AI requests failing

**Common Causes & Solutions:**

#### 1. Missing API Key

**Solution:**
1. Check `.env.local` has `GEMINI_API_KEY`
2. Verify API key is valid
3. Get key from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. Add to `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
5. Restart development server

#### 2. API Key Invalid or Expired

**Solution:**
1. Generate new API key
2. Update `.env.local`
3. Restart server
4. Try AI features again

#### 3. Rate Limits Reached

**Solution:**
1. Wait a few minutes
2. Check Google AI Studio quota
3. Upgrade API plan if needed
4. Retry request

#### 4. Network Issues

**Solution:**
1. Check internet connection
2. Try different network
3. Check firewall settings
4. Verify Google AI API is accessible

---

### AI Suggestions Are Inaccurate or Unhelpful

**Not a Bug - Expected Behavior:**
- AI is a tool, not perfect
- Review all suggestions carefully
- Use as starting point, not final answer

**Improvement Tips:**
1. Be more specific in prompts
2. Provide more context
3. Select specific text to edit
4. Try rephrasing your request
5. Use different AI features

---

## Export Issues

### Export Not Working / Download Fails

**Symptoms:**
- Export button doesn't respond
- File doesn't download
- Browser blocks download

**Solutions:**

#### Allow Popups
1. Check browser popup blocker
2. Allow popups from ScriptScribbler domain
3. Try export again

#### Check Browser Downloads
1. Look in Downloads folder
2. Check browser download bar/manager
3. Verify browser allows downloads

#### Try Different Format
1. If PDF fails, try Fountain
2. If Fountain fails, try Plain Text
3. Use `.scribbler` as fallback

---

### PDF Export Not Working

**Symptoms:**
- Print dialog doesn't open
- PDF looks wrong
- Formatting issues

**Solutions:**

#### Ensure Print Dialog Opens
1. Allow popups for ScriptScribbler
2. Click Export > PDF again
3. Check browser console for errors

#### Fix Formatting in Print Dialog
1. Select "Save as PDF" as destination
2. Set margins to "Default"
3. Disable headers and footers
4. Use Portrait orientation
5. 100% scale (no shrinking)

#### Try Alternative Browsers
1. Chrome/Edge recommended
2. Firefox works well
3. Safari may have issues (try Chrome)

---

### Exported File Won't Open in Other Software

**Symptoms:**
- Final Draft won't open .fdx file
- Fountain file shows errors

**Solutions:**

#### Verify Software Version
1. Check minimum version requirements
2. Update software if needed
3. Try Fountain format (universal)

#### Re-export from ScriptScribbler
1. Open script in ScriptScribbler
2. Use "Fix Formatting" AI tool
3. Export again
4. Try opening in target software

#### Use Universal Format
1. Export as Fountain (.fountain)
2. Import Fountain into target software
3. Fountain is most compatible format

---

## Import Issues

### Scrite Import Fails

**Symptoms:**
- Import doesn't work
- Partial import (missing data)
- Error messages during import

**Solutions:**

#### Verify File Format
1. Ensure file is `.scrite` format
2. File should not be corrupted
3. Try re-exporting from Scrite

#### Check File Size
1. Very large files may timeout
2. Try splitting into multiple scripts
3. Import characters/scenes separately

#### Browser Console Errors
1. Open browser console (F12)
2. Look for specific error messages
3. Take screenshot and report issue

---

## Performance Issues

### Slow Editor / Lag When Typing

**Symptoms:**
- Typing has delay
- Editor feels sluggish
- Slow scrolling

**Solutions:**

#### Large Script Size
1. Consider splitting into multiple scripts
2. Use scene blocks to collapse content
3. Close unused tabs/windows

#### Browser Performance
1. Close other browser tabs
2. Restart browser
3. Clear browser cache
4. Update browser to latest version

#### Computer Resources
1. Close other applications
2. Check CPU/memory usage
3. Restart computer if needed

---

### Slow AI Responses

**Symptoms:**
- AI takes long time to respond
- Requests timeout

**Solutions:**

#### Check Internet Speed
1. Verify good internet connection
2. Try different network if available
3. Wait for better connectivity

#### Reduce Context Size
1. Select smaller text portions
2. Use specific prompts
3. Break into smaller requests

#### API Load
1. Try during off-peak hours
2. Wait a moment and retry
3. Check Google AI status

---

## Data & Sync Issues

### Characters Not Appearing

**Symptoms:**
- Characters tab is empty
- Characters from dialogue not showing

**Solutions:**

#### Trigger Character Sync
1. Go to Editor tab
2. Make small edit to character dialogue
3. Save (auto-save after 1 second)
4. Check Characters tab again

#### Create Characters Manually
1. Go to Characters tab
2. Click "Add Character"
3. Enter character name
4. Add details

---

### Characters Won't Delete

**Symptoms:**
- Delete button doesn't work
- Character comes back after deletion

**Expected Behavior:**
- Characters must be deleted from **Characters tab**
- Removing from script doesn't delete them (by design)

**Solution:**
1. Go to **Characters tab** (not Editor)
2. Click menu (⋮) on character card
3. Select "Delete"
4. Confirm deletion

> See [Character Management](Character-Management) for details on character persistence.

---

### Scenes Not Updating

**Symptoms:**
- Scene count wrong
- Scene list outdated

**Solutions:**

#### Refresh Scene Data
1. Edit scene heading in Editor
2. Save changes
3. Go to Scenes tab
4. Scene data should update

#### Manual Scene Update
1. Go to Scenes tab
2. Click "Edit Scene"
3. Update metadata manually
4. Save changes

---

## Browser-Specific Issues

### Chrome / Edge

**Common Issues:**
- PDF export works best
- Good performance overall

**Solutions:**
- Update to latest version
- Clear cache if issues persist

---

### Firefox

**Common Issues:**
- Occasional popup blocking
- PDF export may need permission

**Solutions:**
- Allow popups for ScriptScribbler
- Update to latest version

---

### Safari

**Common Issues:**
- PDF export may not work well
- Some features may be limited

**Solutions:**
- Use Chrome or Firefox instead
- Update macOS and Safari
- Try Fountain export instead of PDF

---

### Mobile Browsers

**Current Status:**
- Limited mobile optimization
- Desktop experience recommended

**Workaround:**
- Use desktop mode in browser
- Better to use desktop/laptop
- Mobile optimization planned for future

---

## Development Issues

### Build Fails

**Solutions:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build`
4. Check for TypeScript errors: `npm run typecheck`

---

### TypeScript Errors

**Solutions:**
1. Run `npm run typecheck`
2. Fix reported errors
3. Ensure all types are defined
4. Check imports are correct

---

### Linting Errors

**Solutions:**
1. Run `npm run lint`
2. Fix reported issues
3. Use `npm run lint -- --fix` for auto-fixes
4. Follow code style guidelines

---

## Getting Help

### Still Having Issues?

If none of these solutions work:

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for error messages
   - Take screenshots of errors

2. **Verify Setup**
   - Review [Getting Started](Getting-Started) guide
   - Double-check environment variables
   - Ensure Firebase is configured correctly

3. **Try Clean Install**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **Report the Issue**
   - Create GitHub issue with:
     - Detailed description
     - Steps to reproduce
     - Browser and OS version
     - Screenshots/error messages
     - Console logs

---

**Related Pages:**
- [Getting Started](Getting-Started) - Initial setup
- [Application Features](Application-Features) - Feature overview
- [Character Management](Character-Management) - Character system details

---

**💡 Troubleshooting Tip:** Always check the browser console (F12) first - it often shows exactly what the problem is!
