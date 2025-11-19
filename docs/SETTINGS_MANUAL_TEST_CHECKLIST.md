# Settings Manual Testing Checklist

## Overview

This checklist should be completed to verify that all Settings dialog functionality works correctly. Use this for manual testing and quality assurance before deploying new versions.

**Tester:** ___________________  
**Date:** ___________________  
**Version/Branch:** ___________________  
**Browser:** ___________________  
**OS:** ___________________

---

## Pre-Testing Setup

- [ ] Clear browser localStorage (F12 → Application → Local Storage → Clear)
- [ ] Clear browser cache
- [ ] Open browser DevTools Console (F12)
- [ ] Navigate to application home page
- [ ] Verify application loads without errors in console

---

## 1. Settings Dialog Access

### Test 1.1: Open Settings Dialog
- [ ] Click on user avatar in top-right corner
- [ ] Click "Settings" menu item
- [ ] Settings dialog opens successfully
- [ ] Dialog shows 4 tabs: General, Editor, Privacy, Advanced
- [ ] Dialog is centered and responsive
- [ ] Close button visible at bottom

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 2. General Tab Testing

### Test 2.1: Theme Toggle - Light Mode
- [ ] Navigate to General tab
- [ ] Select "Light" theme option
- [ ] Close Settings dialog
- [ ] Application uses light color scheme
- [ ] Background is light colored
- [ ] Text is dark and readable
- [ ] Reload page (F5)
- [ ] Light theme persists after reload
- [ ] Verify localStorage: `scriptscribbler-settings` contains `"theme":"light"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 2.2: Theme Toggle - Dark Mode
- [ ] Open Settings → General tab
- [ ] Select "Dark" theme option
- [ ] Application uses dark color scheme immediately
- [ ] Background is dark colored
- [ ] Text is light and readable
- [ ] Reload page (F5)
- [ ] Dark theme persists after reload
- [ ] Verify localStorage: `"theme":"dark"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 2.3: Theme Toggle - System/Auto Mode
- [ ] Open Settings → General tab
- [ ] Select "System/Auto" theme option
- [ ] Application matches your OS theme preference
- [ ] If possible, change OS theme preference
- [ ] Application theme updates automatically (may need refresh)
- [ ] Reload page (F5)
- [ ] System/Auto setting persists
- [ ] Verify localStorage: `"theme":"system"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 2.4: Export Format Selection
- [ ] Open Settings → General tab
- [ ] Note current "Default Export Format" value
- [ ] Change to "Fountain"
- [ ] Close Settings
- [ ] Navigate to Editor view (if available)
- [ ] Click Export dropdown in header
- [ ] Quick Export shows "Export as Fountain (Default)"
- [ ] Change to "Final Draft (.fdx)"
- [ ] Quick Export updates to "Export as Final Draft (Default)"
- [ ] Reload page (F5)
- [ ] Export format setting persists
- [ ] Verify localStorage: `"exportFormat":"finalDraft"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 2.5: Language Selection (Disabled)
- [ ] Open Settings → General tab
- [ ] Language dropdown is disabled (grayed out)
- [ ] Shows "English" as current value
- [ ] Help text says "feature coming soon"
- [ ] Cannot interact with dropdown

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 3. Editor Tab Testing

### Test 3.1: Font Size Adjustment
- [ ] Open Settings → Editor tab
- [ ] Note current font size value (default 16px)
- [ ] Move slider to minimum (12px)
- [ ] Value display updates to "12px"
- [ ] If editor visible, font size updates immediately
- [ ] Move slider to maximum (24px)
- [ ] Value display updates to "24px"
- [ ] Font size in editor updates (if visible)
- [ ] Set to 18px
- [ ] Close Settings
- [ ] Navigate to Editor view
- [ ] Editor text is visibly larger than default
- [ ] Reload page (F5)
- [ ] Font size remains at 18px
- [ ] Verify localStorage: `"editorFontSize":18`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 3.2: AI Features Toggle - Disable
- [ ] Open Settings → Editor tab
- [ ] AI Features switch is ON by default
- [ ] Toggle AI Features switch to OFF
- [ ] Switch updates visually
- [ ] Close Settings
- [ ] Navigate to Editor view
- [ ] Create or open a script
- [ ] Select text in a script block
- [ ] AI context menu does NOT appear
- [ ] AI FAB (floating action button) is hidden
- [ ] Other editor features still work normally
- [ ] Reload page (F5)
- [ ] AI features remain disabled
- [ ] Verify localStorage: `"aiFeatureEnabled":false`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 3.3: AI Features Toggle - Enable
- [ ] With AI features disabled, open Settings → Editor
- [ ] Toggle AI Features switch to ON
- [ ] Close Settings
- [ ] Navigate to Editor view
- [ ] Select text in a script block
- [ ] AI context menu appears on text selection
- [ ] AI FAB is visible
- [ ] AI features are functional
- [ ] Reload page (F5)
- [ ] AI features remain enabled
- [ ] Verify localStorage: `"aiFeatureEnabled":true` or undefined

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 4. Privacy Tab Testing

### Test 4.1: Public Profile Toggle
- [ ] Open Settings → Privacy tab
- [ ] Public Profile switch is ON by default
- [ ] Toggle switch to OFF
- [ ] Switch updates visually
- [ ] Help text explains profile visibility
- [ ] Toggle back to ON
- [ ] Reload page (F5)
- [ ] Reopen Settings → Privacy
- [ ] Public Profile shows correct state (ON)
- [ ] Verify localStorage: `"profilePublic":true`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 4.2: Script Sharing Default - Private
- [ ] Open Settings → Privacy tab
- [ ] "Private" is selected by default
- [ ] Read description: "New scripts are only visible to you by default"
- [ ] Select "Public"
- [ ] Description changes: "New scripts are visible to all users by default"
- [ ] Select "Private" again
- [ ] Reload page (F5)
- [ ] Reopen Settings → Privacy
- [ ] "Private" is still selected
- [ ] Verify localStorage: `"scriptSharingDefault":"private"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 4.3: Script Sharing Default - Public
- [ ] Open Settings → Privacy tab
- [ ] Select "Public"
- [ ] Close Settings
- [ ] Reload page (F5)
- [ ] Reopen Settings → Privacy
- [ ] "Public" is selected
- [ ] Verify localStorage: `"scriptSharingDefault":"public"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 5. Advanced Tab Testing

### Test 5.1: Project Linking Mode - Shared
- [ ] Open Settings → Advanced tab
- [ ] "Single Shared Project" is selected by default
- [ ] Read description about working on same project
- [ ] Setting persists after reload
- [ ] Verify localStorage: `"projectLinkingMode":"shared"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 5.2: Project Linking Mode - Separate
- [ ] Open Settings → Advanced tab
- [ ] Select "Separate Projects"
- [ ] Read description about different projects
- [ ] Close Settings
- [ ] Reload page (F5)
- [ ] Reopen Settings → Advanced
- [ ] "Separate Projects" is selected
- [ ] Verify localStorage: `"projectLinkingMode":"separate"`

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 5.3: AI Model Information
- [ ] Open Settings → Advanced tab
- [ ] Scroll to "AI Model" section
- [ ] Information box shows "gemini-2.5-flash"
- [ ] Information is read-only
- [ ] Styled with muted background

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 5.4: Feedback Submission - Empty
- [ ] Open Settings → Advanced tab
- [ ] Leave feedback textarea empty
- [ ] Click "Submit Feedback" button
- [ ] Error toast appears: "Feedback cannot be empty"
- [ ] Dialog remains open

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 5.5: Feedback Submission - Success
**Note:** Requires being logged in with valid Firebase configuration

- [ ] Open Settings → Advanced tab
- [ ] Type test feedback: "This is a test feedback"
- [ ] Click "Submit Feedback" button
- [ ] Button shows loading state (spinner)
- [ ] Success toast appears: "Feedback Submitted"
- [ ] Textarea clears
- [ ] Settings dialog closes automatically
- [ ] Check Firebase Console → Firestore → feedback collection
- [ ] New document exists with your feedback

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 5.6: Debug Log Export
- [ ] Open Settings → Advanced tab
- [ ] Click "Export" button in Debugging section
- [ ] Button shows loading state
- [ ] Toast appears: "Generating Debug Log..."
- [ ] File downloads with name pattern: `scriptscribbler_debug_*.txt`
- [ ] Success toast appears: "Debug Log Exported"
- [ ] Open downloaded file
- [ ] File contains timestamp
- [ ] File contains AI Health Diagnosis section
- [ ] File contains Raw Application State section
- [ ] Application state is in JSON format

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 6. Settings Persistence Testing

### Test 6.1: All Settings Persist Together
- [ ] Configure all settings with non-default values:
  - Theme: Dark
  - Export Format: Fountain
  - Font Size: 20px
  - AI Features: OFF
  - Public Profile: OFF
  - Script Sharing: Public
  - Project Linking: Separate
- [ ] Close browser completely
- [ ] Reopen application
- [ ] Open Settings and verify all tabs:
  - General: Theme is Dark, Export is Fountain
  - Editor: Font Size is 20px, AI Features OFF
  - Privacy: Profile OFF, Sharing is Public
  - Advanced: Linking is Separate
- [ ] All settings maintained correctly

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 6.2: LocalStorage Verification
- [ ] Open Browser DevTools (F12)
- [ ] Go to Application → Local Storage
- [ ] Find domain in the list
- [ ] Find key: `scriptscribbler-settings`
- [ ] Click to view value
- [ ] Verify JSON structure includes all settings
- [ ] Values match what you set in settings dialog

**Expected JSON structure:**
```json
{
  "projectLinkingMode": "separate",
  "theme": "dark",
  "exportFormat": "fountain",
  "editorFontSize": 20,
  "aiFeatureEnabled": false,
  "profilePublic": false,
  "scriptSharingDefault": "public"
}
```

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 7. Cross-Component Integration Testing

### Test 7.1: Theme Affects All Components
- [ ] Set theme to Dark
- [ ] Navigate through all views:
  - Dashboard
  - Editor
  - Logline
  - Scenes
  - Characters
  - Notes
- [ ] All views use dark theme consistently
- [ ] No components stuck in light theme
- [ ] Text readable on all screens

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 7.2: Font Size Affects Editor Content
- [ ] Set font size to 22px
- [ ] Navigate to Editor view
- [ ] Open or create a script
- [ ] Add different block types:
  - Scene heading
  - Action
  - Character
  - Dialogue
  - Transition
- [ ] All block types respect the 22px font size
- [ ] Relative sizing maintained (headings still relatively larger)

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 7.3: AI Toggle Affects All AI Features
- [ ] Disable AI Features in settings
- [ ] Check all locations where AI appears:
  - Editor view: AI FAB hidden
  - Script blocks: No AI context menu on text selection
  - AI-related buttons disabled/hidden
- [ ] Re-enable AI Features
- [ ] All AI features return and are functional

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 7.4: Export Format Quick Access
- [ ] Set default export format to "Plain Text"
- [ ] Navigate to a script
- [ ] Click Export dropdown in header
- [ ] Verify "Export as Plain Text (Default)" appears first
- [ ] Click quick export
- [ ] Plain text export is triggered
- [ ] All other formats still available in "All Formats" section

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 8. UI/UX Testing

### Test 8.1: Settings Dialog Layout
- [ ] Dialog is properly centered on screen
- [ ] Dialog has appropriate max-width (not too wide)
- [ ] Dialog has appropriate max-height (fits on screen)
- [ ] Content area is scrollable if needed
- [ ] Tabs are clearly visible and labeled
- [ ] Close button is accessible
- [ ] Dialog has proper spacing and padding

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 8.2: Responsive Design
**Desktop:**
- [ ] Dialog displays well on full-screen
- [ ] All controls are properly sized
- [ ] Text is readable

**Tablet (if available):**
- [ ] Dialog adapts to smaller width
- [ ] Tabs still accessible
- [ ] Controls usable

**Mobile (if available):**
- [ ] Dialog takes appropriate width
- [ ] Tabs switch to mobile layout if needed
- [ ] Controls are touch-friendly

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 8.3: Keyboard Navigation
- [ ] Open Settings with keyboard (if shortcut exists)
- [ ] Tab key moves between form elements
- [ ] Arrow keys work in radio groups
- [ ] Space bar toggles switches
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialog

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 8.4: Visual Feedback
- [ ] Hover states visible on interactive elements
- [ ] Focus states visible for keyboard navigation
- [ ] Active states clear on buttons
- [ ] Loading states show during async operations
- [ ] Success/error toasts appear and are readable
- [ ] Transitions are smooth (not jarring)

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 9. Error Handling Testing

### Test 9.1: LocalStorage Disabled
**Setup:** Disable localStorage in browser settings (or use private mode with localStorage blocked)

- [ ] Open application
- [ ] Open Settings
- [ ] Try to change settings
- [ ] Check browser console for warnings/errors
- [ ] Application doesn't crash
- [ ] Settings changes work (even if not persisted)

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 9.2: Feedback Without Login
**Setup:** Sign out of application

- [ ] Open Settings → Advanced
- [ ] Type feedback
- [ ] Click Submit Feedback
- [ ] Error message: "You must be logged in to submit feedback"
- [ ] Dialog remains open
- [ ] Feedback not lost

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 9.3: Network Error During Feedback
**Setup:** Disable network or block Firebase

- [ ] Type feedback
- [ ] Click Submit Feedback
- [ ] Error handling occurs gracefully
- [ ] User sees error message
- [ ] Application doesn't crash

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## 10. Browser Compatibility Testing

### Chrome/Chromium
- [ ] All tests pass
- [ ] No console errors
- [ ] Smooth performance

**Version:** ___________  
**Result:** ✅ Pass / ❌ Fail

### Firefox
- [ ] All tests pass
- [ ] No console errors
- [ ] Smooth performance

**Version:** ___________  
**Result:** ✅ Pass / ❌ Fail

### Safari (if available)
- [ ] All tests pass
- [ ] No console errors
- [ ] Smooth performance

**Version:** ___________  
**Result:** ✅ Pass / ❌ Fail

### Edge
- [ ] All tests pass
- [ ] No console errors
- [ ] Smooth performance

**Version:** ___________  
**Result:** ✅ Pass / ❌ Fail

---

## 11. Performance Testing

### Test 11.1: Settings Load Time
- [ ] Clear localStorage
- [ ] Reload page
- [ ] Measure time to first render
- [ ] Open Settings dialog
- [ ] Settings open quickly (< 1 second)
- [ ] No visible lag

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

### Test 11.2: Settings Change Responsiveness
- [ ] Change theme
- [ ] Theme applies immediately (< 100ms perceptible)
- [ ] Move font size slider
- [ ] Font size updates smoothly without lag
- [ ] Toggle AI features
- [ ] Change takes effect immediately

**Result:** ✅ Pass / ❌ Fail  
**Notes:** ________________________________________________

---

## Summary

**Total Tests:** 67  
**Passed:** _______  
**Failed:** _______  
**Skipped:** _______  

**Critical Issues Found:** _______________________________________

**Minor Issues Found:** _______________________________________

**Recommendations:** _______________________________________

**Overall Assessment:** ✅ Ready for Production / ⚠️ Needs Minor Fixes / ❌ Needs Major Fixes

**Tester Signature:** ___________________  
**Date:** ___________________

---

## Notes Section

Use this space for additional observations, screenshots, or detailed issue descriptions:

________________________________________________________________

________________________________________________________________

________________________________________________________________

________________________________________________________________

________________________________________________________________

________________________________________________________________
