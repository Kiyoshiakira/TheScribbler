# Character Management in ScriptScribbler

## Overview

ScriptScribbler uses a Scrite-inspired approach to character management, where characters exist independently from the script content. This design provides flexibility and prevents accidental data loss.

## How Character Management Works

### Automatic Character Creation

When you write dialogue in the Editor tab:
- Characters are **automatically created** when they first appear in dialogue blocks
- The character name is extracted from CHARACTER blocks (e.g., `JOHN`, `SARAH (V.O.)`)
- Voice-over and off-screen indicators `(V.O.)` and `(O.S.)` are automatically stripped from the name
- New characters appear in the Characters tab with default empty profiles

### Scene Count Tracking

- The system automatically tracks how many scenes each character appears in
- Scene counts update in real-time as you edit your script
- A character's scene count shows on their card in the Characters tab

### Character Persistence

**Important:** Characters are **NOT automatically deleted** when removed from your script.

This Scrite-like behavior means:
- If you delete all dialogue for a character, they remain in the Characters tab
- Their scene count updates to `0` scenes
- Characters persist until you **manually delete** them from the Characters tab
- This prevents accidental loss of character profiles, descriptions, and portraits

### Manual Character Deletion

To delete a character:
1. Go to the **Characters** tab
2. Click the menu icon (⋮) on the character card
3. Select **Delete**
4. Confirm the deletion

Once manually deleted, a character will:
- Be permanently removed from the database
- **Not be automatically recreated** even if they appear in dialogue later
- Need to be manually re-added or will be auto-created as a new character if their name appears in dialogue

## Benefits of This Approach

1. **No Accidental Loss**: Your character profiles, descriptions, and portraits are safe even if you temporarily remove dialogue
2. **Flexible Editing**: You can restructure your script without worrying about losing character data
3. **Clear Intent**: Only characters you explicitly delete are removed
4. **Professional Workflow**: Matches the behavior of professional screenwriting software like Scrite

## Example Workflow

### Scenario: Temporarily Removing a Character

1. You have a character "ALEX" with a detailed profile and custom portrait
2. You restructure your script and remove all of ALEX's dialogue
3. ALEX remains in the Characters tab with "0 Scenes"
4. Later, you add ALEX back to the script
5. The scene count updates automatically, and all profile data remains intact

### Scenario: Permanently Removing a Character

1. You decide to cut a character "BETH" from your screenplay entirely
2. You remove all of BETH's dialogue from the script
3. BETH now shows "0 Scenes" in the Characters tab
4. You manually delete BETH from the Characters tab
5. BETH is permanently removed from your project
6. If you later add dialogue for BETH, a new character entry is created

## Technical Details

Character sync happens automatically when:
- The script content is saved (debounced after 1 second of inactivity)
- Character names are detected in dialogue blocks
- Scene headings change (affecting scene numbers)

The sync process:
- Creates new characters for names not in the database
- Updates scene counts for existing characters
- Sets scene count to 0 for characters no longer in the script
- Never auto-deletes characters

## Comparison with Other Software

### Scrite
ScriptScribbler's character management mirrors Scrite's approach:
- Characters persist independently from script content
- Manual deletion required for permanent removal
- Automatic creation for convenience

### Other Screenwriting Software
Some screenwriting software automatically deletes characters when they're removed from scripts. ScriptScribbler intentionally does NOT do this to prevent data loss.

## Tips

- Regularly review your Characters tab and delete unused characters to keep your project organized
- Characters with "0 Scenes" are candidates for deletion if no longer needed
- Consider keeping character profiles even for minor characters for future reference
- Use the scene count as a guide for character importance and screen time

## Troubleshooting

**Q: I deleted a character but it came back!**
- A: Make sure you deleted it from the Characters tab, not just removed their dialogue from the script.

**Q: Why do I have characters with 0 scenes?**
- A: These characters no longer appear in your script but haven't been manually deleted. This is intentional to prevent data loss.

**Q: Can I prevent auto-creation of characters?**
- A: No, characters are automatically created when detected in dialogue. However, you can immediately delete unwanted characters from the Characters tab.

**Q: What happens to character data when I delete them?**
- A: All character data (name, description, profile, portrait) is permanently deleted from the database. This action cannot be undone.
