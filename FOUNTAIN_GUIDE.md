# Fountain Syntax Guide for ScriptScribbler

ScriptScribbler now supports enhanced Fountain syntax for screenplay formatting. This document provides examples of all supported block types.

## Scene Headings

Standard scene headings:
```
INT. COFFEE SHOP - DAY
EXT. BEACH - NIGHT
I/E. CAR - CONTINUOUS
```

Forced scene headings (start with a period):
```
.FLASHBACK - 10 YEARS AGO
```

## Action/Description

Regular action text is formatted as action blocks:
```
The hero walks into the room and looks around.
```

## Character Names & Dialogue

Character names are in ALL CAPS, followed by dialogue:
```
JOHN
Hello, how are you?
```

With voice-over or off-screen notation:
```
SARAH (V.O.)
This is my story.

MIKE (O.S.)
I'm in the other room!
```

## Parentheticals

Parentheticals appear in parentheses between character and dialogue:
```
EMMA
(whispering)
Can you keep a secret?
```

## Transitions

Transitions are RIGHT-ALIGNED and in ALL CAPS:
```
CUT TO:
FADE OUT:
DISSOLVE TO:
```

Force a transition with >:
```
> SMASH CUT TO:
```

## Centered Text

Center text by wrapping it with > and <:
```
> THE END <
> 10 YEARS LATER <
```

## Section Headings

Create sections with # (useful for acts or major divisions):
```
# Act One
# Act Two - The Confrontation
```

## Synopsis

Add synopsis notes with = (these are formatted differently):
```
= This scene introduces the main character and sets up the conflict.
```

## Keyboard Shortcuts

- **Tab**: Cycle through block types
- **Enter**: Create new block after current
- **Shift+Enter**: Add line break within current block
- **Backspace** (at start of block): Merge with previous block

## Scene Blocks

The editor automatically groups scenes into collapsible blocks. Each scene block shows:
- Scene number
- Scene setting (if available)
- Estimated time (if available)
- Scene description (if available)

Click the chevron icon to collapse/expand scenes for easier navigation.
