# Fountain Syntax Guide

ScriptScribbler supports enhanced Fountain syntax for screenplay formatting. Fountain is a simple markup syntax for writing, editing, and sharing screenplays in plain, human-readable text.

## What is Fountain?

Fountain is a plain text markup language designed specifically for screenwriting. It allows you to focus on writing while the editor handles the formatting. The syntax is intuitive and mirrors common screenplay conventions.

## Screenplay Elements

### Scene Headings

Scene headings (also called sluglines) establish the location and time of a scene.

**Standard Scene Headings:**
```
INT. COFFEE SHOP - DAY
EXT. BEACH - NIGHT
I/E. CAR - CONTINUOUS
```

**Forced Scene Headings:**
Start with a period (`.`) to force any line to be a scene heading:
```
.FLASHBACK - 10 YEARS AGO
.DREAM SEQUENCE
```

**Best Practices:**
- Use ALL CAPS for scene headings
- Start with INT. (interior), EXT. (exterior), or I/E (interior/exterior)
- Include time of day (DAY, NIGHT, CONTINUOUS, etc.)

### Action/Description

Regular action text describes what's happening on screen.

**Example:**
```
The hero walks into the room and looks around.
The lights flicker and go out.
```

**Best Practices:**
- Use present tense
- Be visual and specific
- Keep it concise
- Avoid camera directions (unless essential)

### Character Names & Dialogue

Character names appear in ALL CAPS, followed by their dialogue.

**Basic Dialogue:**
```
JOHN
Hello, how are you?

SARAH
I'm doing well, thanks for asking.
```

**With Voice-Over (V.O.):**
```
SARAH (V.O.)
This is my story. I was young and naive.
```

**With Off-Screen (O.S.):**
```
MIKE (O.S.)
I'm in the other room!
```

**Best Practices:**
- Character names in ALL CAPS
- Keep dialogue natural and concise
- Use (V.O.) for voice-over narration
- Use (O.S.) for off-screen dialogue

### Parentheticals

Parentheticals (also called wrylies) give direction to the actor about how to deliver a line.

**Example:**
```
EMMA
(whispering)
Can you keep a secret?

DAVID
(nervously)
Of course. What is it?
```

**Best Practices:**
- Use sparingly
- Keep them brief
- Don't direct the actor unnecessarily
- Focus on essential delivery notes

### Transitions

Transitions indicate how to move from one scene to another.

**Standard Transitions:**
```
CUT TO:

FADE OUT:

DISSOLVE TO:

SMASH CUT TO:
```

**Forced Transitions:**
Use `>` to force a transition:
```
> MATCH CUT TO:
```

**Best Practices:**
- Right-aligned and in ALL CAPS
- Use sparingly (they're often unnecessary)
- Common transitions: CUT TO, FADE OUT, DISSOLVE TO

### Centered Text

Center text by wrapping it with `>` and `<`:

**Examples:**
```
> THE END <

> 10 YEARS LATER <

> TITLE CARD: "Based on a True Story" <
```

**Use For:**
- Title cards
- Time markers
- "THE END"
- Special text that needs emphasis

### Section Headings

Create sections with `#` (useful for acts or major divisions):

**Examples:**
```
# Act One

# Act Two - The Confrontation

# Epilogue
```

**Best Practices:**
- Use for major structural divisions
- Not visible in final output (organizational only)
- Helps navigate large scripts

### Synopsis

Add synopsis notes with `=` (these are formatted differently and can be hidden):

**Example:**
```
= This scene introduces the main character and sets up the central conflict.
```

**Best Practices:**
- Use for planning and organization
- Summarize scene purpose
- Can be hidden/shown as needed
- Not included in final export

## Keyboard Shortcuts

Master these shortcuts to speed up your workflow:

| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle through block types |
| `Enter` | Create new block after current |
| `Shift+Enter` | Add line break within current block |
| `Backspace` (at start) | Merge with previous block |
| `Ctrl/Cmd + F` | Find in script |

## Scene Blocks

The editor automatically groups scenes into collapsible blocks for easier navigation.

**Each Scene Block Shows:**
- Scene number
- Scene setting (if available)
- Estimated time (if available)
- Scene description (if available)

**Features:**
- Click the chevron icon to collapse/expand scenes
- Hover to see scene metadata
- Visual separation between scenes
- Easier navigation in long scripts

## Complete Example

Here's a complete example showing various Fountain elements:

```
# Act One

INT. COFFEE SHOP - DAY

= Sarah meets John for the first time, sparking the central romance.

SARAH, 28, sits alone at a corner table, typing on her laptop. 
The cafe is busy with the morning rush.

JOHN, 30, enters carrying a briefcase. He scans the room for a 
seat and spots the empty chair across from Sarah.

JOHN
Excuse me, is this seat taken?

SARAH
(looking up)
No, please, go ahead.

John sits down and pulls out his laptop.

SARAH (CONT'D)
(smiling)
Writer?

JOHN
(laughing)
That obvious? And you?

SARAH (V.O.)
Little did I know, this chance meeting would 
change everything.

CUT TO:

EXT. COFFEE SHOP - LATER

John and Sarah exit together, laughing.

> THREE MONTHS LATER <

INT. SARAH'S APARTMENT - NIGHT

Sarah sits on her couch, phone in hand, staring at John's 
contact.

SARAH
(to herself)
I have to tell him.

FADE OUT.

# Act Two

...
```

## Tips for Better Fountain Writing

1. **Keep It Simple**: Don't over-format. Fountain is meant to be readable
2. **Be Consistent**: Use the same formatting style throughout
3. **Focus on Story**: Let the software handle the formatting
4. **Use Scene Headings**: Start every scene with a clear heading
5. **Natural Dialogue**: Write how people actually speak
6. **Visual Action**: Show, don't tell
7. **Format for Reading**: Make your script easy to read on screen and paper

## Common Mistakes to Avoid

❌ **Writing stage directions in action**
```
The camera pans across the room.  // Don't do this
```

✅ **Writing visually instead**
```
The room reveals signs of a struggle.
```

❌ **Over-using parentheticals**
```
JOHN
(angry, frustrated, upset, turning away)
I can't believe this.
```

✅ **Using them sparingly**
```
JOHN
(quietly)
I can't believe this.
```

❌ **Unnecessary transitions**
```
CUT TO:  // After every scene
```

✅ **Using only when needed**
```
SMASH CUT TO:  // Only for dramatic cuts
```

## Advanced Features

### Character Cues

The editor automatically detects character names in dialogue and:
- Creates character entries in the Characters tab
- Tracks scene appearances
- Strips (V.O.) and (O.S.) from names
- Updates character counts in real-time

### Auto-Formatting

As you type, ScriptScribbler automatically:
- Formats elements correctly
- Adjusts indentation
- Applies proper styling
- Maintains industry standards

### Scene Tracking

The editor tracks:
- Number of scenes
- Scene locations
- Scene order
- Character appearances per scene

## Export Formats

Your Fountain-formatted script can be exported to:
- **PDF**: Print-ready screenplay
- **Fountain (.fountain)**: Share with other Fountain apps
- **Final Draft (.fdx)**: Import into Final Draft
- **Plain Text (.txt)**: Simple text format

> 📖 **Learn More**: See [Export Functionality](Export-Functionality) for detailed export options.

---

**Ready to start writing?** Head to the [Getting Started](Getting-Started) guide or explore [AI Editor Features](AI-Editor-Features).
