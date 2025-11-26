# Manual Testing Plan for Templates and Snippets Feature

## Prerequisites
- Firebase authentication configured
- User logged in
- At least one script/document created

## Test Plan

### Templates Feature Tests

#### Test 1: Template Picker Access
1. Navigate to Dashboard
2. Verify "Start with Template" button is visible
3. Click the button
4. **Expected**: Template picker dialog opens

#### Test 2: Template Selection and Preview
1. Open template picker
2. Browse through available templates
3. Verify all 6 templates are displayed:
   - Short Story
   - Blog Post
   - Chapter Layout
   - Screenplay Scene
   - Character Profile
   - World Building Entry
4. **Expected**: Each template shows name, description, and placeholder count

#### Test 3: Template with Placeholders
1. Select "Short Story" template
2. **Expected**: Customization dialog opens with fields for:
   - Title
   - Author
   - Content
3. Fill in all fields:
   - Title: "My First Story"
   - Author: "John Doe"
   - Content: "Once upon a time..."
4. Click "Apply Template"
5. **Expected**: New document created with placeholders replaced

#### Test 4: Template Category Filtering
1. Switch to StoryScribbler tool
2. Open template picker
3. **Expected**: Only story-related templates shown
4. Switch to ScriptScribbler
5. **Expected**: All templates shown (category='all')

#### Test 5: Template Cancel/Back
1. Open template picker
2. Select a template
3. Click "Back" button
4. **Expected**: Returns to template selection
5. Click "Cancel"
6. **Expected**: Dialog closes without creating document

### Snippets Feature Tests

#### Test 6: Snippet Manager Access
1. Open a document in the Editor
2. Verify "Snippets" button is visible in toolbar
3. Click the button
4. **Expected**: Snippet Manager dialog opens

#### Test 7: Create Snippet Without Placeholders
1. Open Snippet Manager
2. Click "New Snippet"
3. Fill in:
   - Name: "Scene Intro"
   - Description: "Standard scene introduction"
   - Content: "The door opens slowly, revealing..."
4. Click "Create"
5. **Expected**: Snippet appears in list
6. Verify snippet counter shows "1 snippet"

#### Test 8: Create Snippet With Placeholders
1. Click "New Snippet"
2. Fill in:
   - Name: "Character Dialog"
   - Description: "Character speaking template"
   - Content: "{{Character}}\n{{Dialogue}}"
3. **Expected**: "Detected placeholders: Character, Dialogue" message appears
4. Click "Create"
5. **Expected**: Snippet created with placeholders listed

#### Test 9: Insert Snippet Without Placeholders
1. Find "Scene Intro" snippet
2. Click "Insert" button
3. **Expected**: Content inserted into document immediately
4. **Expected**: Toast notification appears

#### Test 10: Insert Snippet With Placeholders
1. Find "Character Dialog" snippet
2. Click "Insert" button
3. **Expected**: Customization dialog opens
4. Fill in:
   - Character: "JANE"
   - Dialogue: "Hello, world!"
5. Click "Insert"
6. **Expected**: Content inserted with placeholders replaced

#### Test 11: Edit Snippet
1. Find a snippet in the list
2. Click edit icon
3. Modify the name or content
4. Click "Update"
5. **Expected**: Snippet updated in list

#### Test 12: Delete Snippet
1. Find a snippet in the list
2. Click delete icon
3. **Expected**: Confirmation dialog appears
4. Click "Cancel"
5. **Expected**: Snippet not deleted
6. Click delete again
7. Click "Delete" in confirmation
8. **Expected**: Snippet removed from list

#### Test 13: Local Storage Persistence
1. Create 2-3 snippets
2. Close browser tab
3. Reopen application and navigate to Snippet Manager
4. **Expected**: Snippets still present (loaded from localStorage)

#### Test 14: Cloud Storage (Authenticated User)
1. Create a snippet while logged in
2. Verify snippet counter shows "(X cloud, Y local)"
3. Log out and log in from different browser/device
4. **Expected**: Cloud snippets synced across devices

#### Test 15: Snippet Manager Empty State
1. Delete all snippets
2. **Expected**: Empty state message:
   - Icon displayed
   - "No snippets yet" message
   - "Create your first snippet to get started" message

### Edge Cases and Error Handling

#### Test 16: Template with Empty Placeholders
1. Select a template
2. Leave some placeholder fields empty
3. Click "Apply Template"
4. **Expected**: Document created with empty strings for unfilled placeholders

#### Test 17: Snippet Validation
1. Try to create snippet with empty name
2. **Expected**: Error toast "Name and content are required"
3. Try to create snippet with empty content
4. **Expected**: Error toast "Name and content are required"

#### Test 18: Special Characters in Placeholders
1. Create snippet with content: "Hello {{User's Name}}"
2. **Expected**: Placeholder extracted correctly (may need to test)

#### Test 19: Nested/Multiple Placeholders
1. Create snippet: "{{A}} and {{B}} went to {{C}}"
2. Insert snippet
3. Fill all placeholders
4. **Expected**: All placeholders replaced correctly

#### Test 20: Long Content Handling
1. Create snippet with very long content (500+ words)
2. **Expected**: Scrollable preview in list
3. Insert snippet
4. **Expected**: Content inserted correctly

## UI/UX Checks

### Visual Consistency
- [ ] Dialog styling matches existing dialogs
- [ ] Button sizes and colors consistent
- [ ] Icons appropriate and visible
- [ ] Typography consistent with app theme
- [ ] Spacing and padding uniform

### Responsiveness
- [ ] Template picker works on mobile
- [ ] Snippet manager works on mobile
- [ ] Buttons don't overlap on small screens
- [ ] Dialogs are scrollable on small screens

### Accessibility
- [ ] All buttons have proper labels
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] ARIA labels present where needed

## Performance

- [ ] Template picker opens quickly
- [ ] Snippet manager opens quickly
- [ ] No lag when inserting snippets
- [ ] No lag when creating/editing snippets
- [ ] Local storage operations are fast

## Success Criteria

All tests should pass with:
- ✅ No JavaScript errors in console
- ✅ No TypeScript compilation errors
- ✅ All expected behaviors occur
- ✅ No UI glitches or visual bugs
- ✅ Smooth user experience
