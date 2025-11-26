# Test Examples for Advanced AI Editing

This file contains test examples you can use to verify the advanced AI editing features are working correctly.

## Setup

1. Create a new screenplay in ScriptScribbler
2. Add some sample content (provided below)
3. Click the AI assistant (sparkles icon in bottom-right)
4. Enter the test commands

## Sample Screenplay for Testing

Copy this into your screenplay editor:

```
int. coffee shop - morning

sarah walks in, shaking rain from her umbrella

john is sitting at a corner table

john: hey there
sarah: (surprised) john! what are you doing here?
john: just wanted to talk

ext. park - day

sarah and john walk through the park

sarah: about last night...
john: i know. i'm sorry.

int. sarah's apartment - night

sarah enters, exhausted

FADE TO:

int. office - day

marcus stands at the window

marcus: we need to discuss the project
```

## Test Cases

### Test 1: Basic Formatting

**Command:** `fix all formatting`

**Expected Result:**
- Scene headings should be UPPERCASE
- Character names should be UPPERCASE
- Proper spacing between blocks
- Parentheticals properly formatted

**Verification:**
- `int. coffee shop - morning` → `INT. COFFEE SHOP - MORNING`
- `john:` → `JOHN` (on separate line)
- `sarah:` → `SARAH`
- `marcus:` → `MARCUS`

---

### Test 2: Uppercase Scene Headings Only

**Command:** `uppercase all scene headings`

**Expected Result:**
- Only scene headings capitalized
- Character names and dialogue unchanged

**Verification:**
- `int. coffee shop - morning` → `INT. COFFEE SHOP - MORNING`
- `ext. park - day` → `EXT. PARK - DAY`
- `int. sarah's apartment - night` → `INT. SARAH'S APARTMENT - NIGHT`
- `int. office - day` → `INT. OFFICE - DAY`

---

### Test 3: Uppercase Character Names Only

**Command:** `uppercase all character names`

**Expected Result:**
- Only character names capitalized
- Scene headings and other text unchanged

**Verification:**
- `john:` → `JOHN`
- `sarah:` → `SARAH`
- `marcus:` → `MARCUS`

---

### Test 4: Create Act Structure

**Command:** `create act structure`

**Expected Result:**
- Three act markers added to document
- Includes section headings and synopsis blocks

**Expected Output:**
```
ACT I - SETUP

Inciting incident and establishing normal world

ACT II - CONFRONTATION

Rising action, midpoint, and complications

ACT III - RESOLUTION

Climax and resolution
```

---

### Test 5: Generate Plot Points

**Command:** `create plot points`

**Expected Result:**
- Five key plot point markers
- Standard three-act structure beats

**Expected Output:**
```
PLOT POINT 1: Inciting Incident

PLOT POINT 2: First Turning Point

PLOT POINT 3: Midpoint

PLOT POINT 4: Second Turning Point

PLOT POINT 5: Climax
```

---

### Test 6: Add Scene Headings

**Command:** `add 3 scene headings`

**Expected Result:**
- Three new scene heading blocks
- Format: `INT. LOCATION N - DAY`

**Expected Output:**
```
INT. LOCATION 1 - DAY

INT. LOCATION 2 - DAY

INT. LOCATION 3 - DAY
```

---

### Test 7: Character-Specific Query

**Command:** `show me all dialogue from SARAH`

**Expected Result:**
- AI identifies all Sarah's dialogue blocks
- Returns or highlights them

**Expected Blocks Found:**
- "(surprised) john! what are you doing here?"
- "about last night..."

---

### Test 8: Scene-Specific Query

**Command:** `improve dialogue in the coffee shop scene`

**Expected Result:**
- AI focuses on INT. COFFEE SHOP - MORNING scene
- Provides suggestions for dialogue improvements
- Maintains character voices

---

## Long Document RAG Testing

For testing RAG (requires 50+ blocks), create a screenplay with 60+ blocks and try:

### Test 9: RAG Character Search

**Setup:** Create a screenplay with 60+ blocks featuring multiple characters

**Command:** `find all scenes with JOHN and improve his dialogue`

**Expected Result:**
- AI searches through all chunks
- Finds relevant scenes with John
- Provides targeted suggestions
- Doesn't process irrelevant scenes (saves tokens)

---

### Test 10: RAG Scene Search

**Setup:** Create a screenplay with multiple location scenes

**Command:** `add more visual detail to the park scenes`

**Expected Result:**
- AI identifies chunks containing park scenes
- Suggests visual enhancements
- Maintains consistency across park scenes

---

## Skylantia Universe Testing

For testing creative consistency, create a Skylantia screenplay:

```
INT. SKY GARDEN PLATFORM - DAY

TRELLIS, a young Legumian Seedling, extends her tendrils toward the sunlight.

BRAMBLE enters through the hanging vines.

BRAMBLE
Sister, I felt you calling through deep rooting.

TRELLIS
(performing deep rooting)
the great source showed me visions.

EXT. FOREST FLOOR - DAY

Below the sky gardens, the chlorophyll council gathers.

SAGE
The younger legumians are questioning our ways.
```

### Test 11: Skylantia Terminology Check

**Command:** `check Skylantia terminology`

**Expected Result:**
- Identifies lowercase "deep rooting" (should be "Deep Rooting")
- Identifies lowercase "the great source" (should be "The Great Source")
- Identifies lowercase "chlorophyll council" (should be "Chlorophyll Council")
- Identifies lowercase "legumians" (should be "Legumians")

---

### Test 12: Skylantia Consistency

**Command:** `fix Skylantia terminology capitalization`

**Expected Result:**
- "deep rooting" → "Deep Rooting"
- "the great source" → "The Great Source"
- "chlorophyll council" → "Chlorophyll Council"
- "legumians" → "Legumians"

---

## Error Handling Tests

### Test 13: Invalid Command

**Command:** `make my screenplay amazing`

**Expected Result:**
- AI explains it's too vague
- Suggests specific commands
- Doesn't error out

---

### Test 14: Empty Document

**Command:** `fix all formatting`

**Expected Result:**
- AI responds that there's no content to format
- Doesn't error out

---

### Test 15: Partial Match

**Command:** `uppercase scenes`

**Expected Result:**
- AI interprets as "uppercase scene headings"
- Applies the rule successfully

---

## Performance Testing

### Test 16: Large Document Performance

**Setup:** Create a screenplay with 100+ blocks

**Command:** `uppercase all scene headings`

**Measure:**
- Response time should be <10 seconds
- All scene headings should be updated
- No blocks should be lost or corrupted

---

### Test 17: Multiple Tools in Sequence

**Command:** `uppercase all scene headings and character names, then remove extra spaces`

**Expected Result:**
- AI applies multiple rules
- Changes are cumulative
- No conflicts between rules

---

## Verification Checklist

After running tests, verify:

- [ ] Formatting commands work correctly
- [ ] Structure generation creates proper blocks
- [ ] Character and scene queries find correct content
- [ ] RAG activates for documents >50 blocks
- [ ] Skylantia terminology is enforced
- [ ] No document corruption
- [ ] Error handling is graceful
- [ ] Performance is acceptable (<10s for most operations)
- [ ] Token usage is reasonable (check logs if possible)
- [ ] Block IDs remain unique and consistent

## Troubleshooting

### Issue: Command not recognized

**Try:**
- Use exact keywords from the command reference
- Simplify the command
- Check GEMINI_API_KEY is set

### Issue: Changes not applied

**Try:**
- Check if AI returned suggestions vs. direct edits
- Look for "Apply" buttons in the AI panel
- Try command with "apply" prefix: "apply formatting rules"

### Issue: Incorrect results

**Try:**
- Make command more specific
- Provide scene or character names
- Use scope keywords: "all", "scene 3", "current scene"

## Reporting Issues

If you find bugs, please report with:
1. The command you used
2. Your screenplay content (or a minimal example)
3. Expected vs. actual result
4. Screenshot if applicable
5. Browser console errors (if any)

## Success Criteria

All tests should:
✅ Complete without errors
✅ Produce expected results
✅ Maintain document integrity
✅ Respond in reasonable time (<10s)
✅ Provide helpful feedback

---

**Note:** Some features may require the latest version of the code and a valid GEMINI_API_KEY environment variable.
