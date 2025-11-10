# Character Management

ScriptScribbler uses a **Scrite-inspired approach** to character management, where characters exist independently from the script content. This design provides flexibility and prevents accidental data loss.

## Overview

Unlike some screenwriting software that automatically deletes characters when they're removed from scripts, ScriptScribbler intentionally preserves character data to prevent accidental loss of profiles, descriptions, and portraits.

## How Character Management Works

### Automatic Character Creation

Characters are automatically created as you write dialogue in the Editor tab.

**Process:**
1. Write dialogue in the editor using Fountain syntax
2. Character is automatically detected from CHARACTER blocks (e.g., `JOHN`, `SARAH (V.O.)`)
3. Voice-over and off-screen indicators `(V.O.)` and `(O.S.)` are automatically stripped from the name
4. New character appears in the Characters tab with a default empty profile
5. Character is ready for you to add details, descriptions, and portraits

**Example:**
```
JOHN
Hello, how are you?
```
This automatically creates a character named "JOHN" in your Characters tab.

### Scene Count Tracking

The system automatically tracks character appearances throughout your script.

**Features:**
- Counts how many scenes each character appears in
- Updates in real-time as you edit your script
- Displays scene count on character cards in the Characters tab
- Helps you track character importance and screen time

**How It Works:**
- Scene headings define scene boundaries
- Dialogue blocks indicate character presence
- Counts update automatically when you save changes
- Zero scenes indicates character no longer in current script

### Character Persistence

**🔑 Key Feature:** Characters are **NOT automatically deleted** when removed from your script.

This Scrite-like behavior means:
- ✅ If you delete all dialogue for a character, they remain in the Characters tab
- ✅ Their scene count updates to `0 scenes`
- ✅ Characters persist until you **manually delete** them from the Characters tab
- ✅ This prevents accidental loss of character profiles, descriptions, and portraits
- ✅ You can restructure your script without losing character data

**Why This Matters:**
Imagine spending time creating a detailed character profile with a custom portrait, only to lose it all because you temporarily removed the character from a scene. ScriptScribbler prevents this!

### Manual Character Deletion

To permanently remove a character:

**Steps:**
1. Navigate to the **Characters** tab in the sidebar
2. Find the character you want to delete
3. Click the menu icon (⋮) on the character card
4. Select **Delete**
5. Confirm the deletion

**After Manual Deletion:**
- Character is permanently removed from the database
- All character data (name, description, profile, portrait) is deleted
- This action cannot be undone
- Character will **not** be automatically recreated if their name appears in dialogue later
- If they appear in dialogue again, they will be auto-created as a new character (empty profile)

## Benefits of This Approach

### 1. No Accidental Loss
Your character profiles, descriptions, and portraits are safe even if you temporarily remove dialogue or restructure scenes.

### 2. Flexible Editing
You can experiment with your script structure without worrying about losing character data.

### 3. Clear Intent
Only characters you explicitly delete are removed. No surprises or data loss.

### 4. Professional Workflow
Matches the behavior of professional screenwriting software like Scrite.

### 5. Easy Character Management
Characters with `0 Scenes` are easy to identify and clean up when you're ready.

## Example Workflows

### Scenario 1: Temporarily Removing a Character

**Situation:** You have a character "ALEX" with a detailed profile and custom portrait. You decide to restructure your script and temporarily remove all of ALEX's dialogue.

**What Happens:**
1. You remove all of ALEX's dialogue from the script
2. ALEX remains in the Characters tab with "0 Scenes"
3. All profile data (description, portrait) remains intact
4. Later, you add ALEX back to the script
5. The scene count updates automatically
6. All profile data is still there

**Result:** ✅ No data loss, smooth workflow

### Scenario 2: Permanently Removing a Character

**Situation:** You decide to cut a character "BETH" from your screenplay entirely.

**What to Do:**
1. Remove all of BETH's dialogue from the script
2. BETH now shows "0 Scenes" in the Characters tab
3. Go to the Characters tab
4. Click the menu (⋮) on BETH's card
5. Select "Delete" and confirm
6. BETH is permanently removed from your project

**If You Add BETH Later:**
- If you later write dialogue for BETH, a new character entry is created
- The new entry will have an empty profile (previous data was deleted)

**Result:** ✅ Character fully removed when intended

### Scenario 3: Script Restructuring

**Situation:** You're reorganizing your screenplay and moving scenes around.

**What Happens:**
1. Some characters may temporarily drop to "0 Scenes" during restructuring
2. All character data remains safe in the Characters tab
3. As you add scenes back, scene counts update automatically
4. No manual re-creation needed

**Result:** ✅ Stress-free reorganization

## Character Tab Features

### Character Cards

Each character card displays:
- **Character Name**: In all caps (as it appears in dialogue)
- **Scene Count**: Number of scenes the character appears in
- **Profile Picture**: AI-generated or custom uploaded portrait
- **Description**: Character details and background
- **Menu Options**: Edit or delete character

### Editing Characters

Click on a character card to:
- Edit character name
- Update description
- Change or generate AI portrait
- View scene appearances
- Add character notes

### AI-Generated Profiles

ScriptScribbler can generate:
- **Character Descriptions**: AI-powered backstory and personality
- **Character Portraits**: AI-generated profile images
- **Character Traits**: Detailed character attributes

## Technical Details

### Automatic Sync

Character synchronization happens automatically when:
- Script content is saved (debounced after 1 second of inactivity)
- Character names are detected in dialogue blocks
- Scene headings change (affecting scene numbers)

### Sync Process

The system:
1. ✅ Creates new characters for names not in the database
2. ✅ Updates scene counts for existing characters
3. ✅ Sets scene count to 0 for characters no longer in the script
4. ❌ Never auto-deletes characters

### Character Name Processing

The system automatically:
- Strips `(V.O.)` from character names
- Strips `(O.S.)` from character names
- Normalizes character names to uppercase
- Handles character name variations

**Example:**
```
SARAH (V.O.)
This is my story.
```
Creates character: `SARAH` (not `SARAH (V.O.)`)

## Comparison with Other Software

### Scrite
ScriptScribbler's character management **mirrors Scrite's approach**:
- ✅ Characters persist independently from script content
- ✅ Manual deletion required for permanent removal
- ✅ Automatic creation for convenience

### Other Screenwriting Software
Some screenwriting software automatically deletes characters when they're removed from scripts. **ScriptScribbler intentionally does NOT do this** to prevent data loss.

## Best Practices

### 1. Regular Character Review
Periodically review your Characters tab and delete unused characters to keep your project organized.

### 2. Use Scene Count as a Guide
- Characters with "0 Scenes" are candidates for deletion if no longer needed
- High scene counts indicate major characters
- Low scene counts may indicate minor or supporting roles

### 3. Preserve Character Profiles
Consider keeping character profiles even for minor characters for future reference or sequel planning.

### 4. AI-Powered Profiles
Use AI generation to quickly create character profiles, then refine them manually for your specific needs.

### 5. Character Organization
Use character descriptions to note:
- Character arc
- Relationship to other characters
- Key scenes or moments
- Character development notes

## Troubleshooting

### Q: I deleted a character but it came back!
**A:** Make sure you deleted it from the **Characters tab**, not just removed their dialogue from the script. Characters must be manually deleted from the Characters tab to be permanently removed.

### Q: Why do I have characters with 0 scenes?
**A:** These characters no longer appear in your script but haven't been manually deleted. This is intentional to prevent data loss. Delete them from the Characters tab if you no longer need them.

### Q: Can I prevent auto-creation of characters?
**A:** No, characters are automatically created when detected in dialogue. However, you can immediately delete unwanted characters from the Characters tab.

### Q: What happens to character data when I delete them?
**A:** All character data (name, description, profile, portrait) is **permanently deleted** from the database. This action cannot be undone.

### Q: Will my character come back if I write their dialogue again?
**A:** If you manually delete a character and then write dialogue for them again, a **new** character entry will be created with an empty profile. The previous character data is not recovered.

### Q: How do I track which characters are in which scenes?
**A:** The scene count shows how many total scenes a character appears in. For more detailed scene tracking, check the Scenes tab which shows characters per scene.

---

**Related Pages:**
- [Application Features](Application-Features) - Overview of all features
- [Fountain Guide](Fountain-Guide) - Learn how to write dialogue
- [AI Editor Features](AI-Editor-Features) - Generate character profiles with AI

---

**💡 Tip:** Use the Characters tab to plan character arcs and ensure balanced character development throughout your screenplay!
