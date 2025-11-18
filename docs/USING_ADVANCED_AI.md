# Using Advanced AI Editing Features

ScriptScribbler now includes powerful document-aware AI editing capabilities. This guide shows you how to use them.

## Quick Start

The AI assistant (sparkles icon in bottom-right) now understands advanced commands that make structured edits to your screenplay.

## Basic Commands

### Formatting Commands

Fix formatting issues across your entire screenplay:

- **"uppercase all scene headings"** - Converts all scene headings to UPPERCASE
- **"uppercase all character names"** - Ensures all character names are UPPERCASE  
- **"fix all formatting"** - Applies all standard formatting rules
- **"remove extra spaces"** - Cleans up extra whitespace
- **"fix parentheticals"** - Ensures proper (parenthetical) formatting

### Structure Generation

Create screenplay structures automatically:

- **"create act structure"** - Generates three-act structure markers
- **"create plot points"** - Adds key plot point section markers
- **"add 5 scene headings"** - Creates 5 new scene heading templates
- **"create dialogue exchange"** - Adds a dialogue template

## Advanced Usage

### Working with Long Screenplays

For screenplays with more than 50 blocks, the AI automatically uses **RAG (Retrieval-Augmented Generation)** to efficiently find and work with relevant sections.

**Example:**
```
"Find all scenes with Sarah and improve the dialogue"
```

The AI will:
1. Search through all scenes
2. Find those featuring Sarah
3. Retrieve only relevant scenes
4. Provide targeted improvements

This saves tokens and makes edits more precise.

### Character-Specific Edits

Search and edit content related to specific characters:

```
"Show me all dialogue from MARCUS"
"Improve action descriptions in scenes with ELENA"
"Find inconsistencies in SARAH's characterization"
```

### Scene-Specific Work

Target specific scenes:

```
"Improve dialogue in scene 3"
"Add more visual detail to the warehouse scenes"
"Make the opening scene more engaging"
```

## Skylantia Universe Mode

If you're writing in the **Skylantia** universe, the AI maintains creative consistency with established lore.

### Terminology Enforcement

The AI knows and enforces:
- **Legumians** - The sentient plant beings
- **Deep Rooting** - Their meditation practice
- **The Great Source** - Their spiritual life force
- **Sky Gardens** - Floating platforms
- **Chlorophyll Council** - Governing body

### Using Skylantia Mode

The AI automatically detects Skylantia content, but you can be explicit:

```
"Check this scene for Skylantia consistency"
"Ensure proper capitalization of Legumian terms"
"Add more plant-based imagery consistent with the world"
```

## Format Consistency Examples

### Before:
```
int. coffee shop - morning

sarah walks in
john: Hey there!
```

### After using "fix all formatting":
```
INT. COFFEE SHOP - MORNING

Sarah walks in.

JOHN
Hey there!
```

## Tips for Best Results

### 1. Be Specific

❌ **Vague:** "Make it better"
✅ **Specific:** "Make the dialogue more natural and add action beats"

### 2. Use Scope Keywords

- **"all"** - Apply to entire document
- **"scene 5"** - Apply to specific scene
- **"this scene"** - Apply to current scene
- **"selected text"** - Apply to selection (if implemented)

### 3. Combine Commands

The AI can understand compound requests:

```
"Uppercase all scene headings and character names, then remove extra spaces"
```

### 4. Ask for Explanations

```
"Explain the three-act structure"
"What are the industry standards for scene headings?"
"How should I format a phone conversation?"
```

## Understanding AI Confidence Levels

When the AI suggests edits, it provides confidence levels:

- **HIGH** - Objective fixes (spelling, grammar, formatting)
- **MEDIUM** - Creative improvements backed by best practices
- **LOW** - Speculative ideas or suggestions

You can filter by confidence:
```
"Show me only high-confidence fixes"
"Apply all formatting corrections"
```

## Working with Story Notes

The AI can search your story notes to ground new content:

```
"Add world details about the Sky Gardens from my notes"
"Insert character background for MARCUS based on my notes"
"Find my notes about the magic system and add relevant details"
```

## Troubleshooting

### "The AI didn't understand my command"

Try rephrasing with keywords the AI recognizes:
- format, uppercase, fix, create, add, improve, enhance
- scene, character, dialogue, action
- all, every, throughout

### "Changes weren't applied"

Some commands only return suggestions. To apply them:
1. Review the suggestions in the AI panel
2. Click "Apply" on changes you want
3. Or use explicit commands: "apply formatting rules"

### "RAG isn't finding the right scenes"

The keyword search is simple. Be specific:
- Include character names: "scenes with MARCUS"
- Include location: "warehouse scenes"
- Include plot elements: "scenes about the artifact"

## Command Reference

### Formatting
- uppercase all scene headings
- uppercase all character names
- capitalize all transitions
- fix spacing
- fix parentheticals
- apply standard margins

### Structure
- create act structure
- create plot points
- add [number] scene headings
- create dialogue exchange
- generate scene sequence

### Content
- improve dialogue
- enhance action descriptions
- add visual details
- make more engaging
- strengthen character voice

### Analysis
- check formatting
- find errors
- analyze structure
- review consistency
- suggest improvements

## Best Practices

1. **Save Often** - While AI edits are reversible, it's good practice to save before major changes

2. **Review Changes** - Always review AI suggestions before applying

3. **Iterative Editing** - Make changes in small batches rather than trying to fix everything at once

4. **Use Specific Commands** - The more specific your command, the better the result

5. **Combine with Manual Editing** - AI is a tool to augment your writing, not replace your creative decisions

## Examples in Action

### Example 1: Formatting a Rough Draft

**Your Draft:**
```
sarah enters the cafe
john is sitting there
john: hey sarah
sarah: john! I didn't expect to see you here
```

**Command:** "fix all formatting"

**Result:**
```
INT. CAFE - DAY

Sarah enters.

John sits at a corner table.

JOHN
Hey, Sarah.

SARAH
John! I didn't expect to see you here.
```

### Example 2: Generating Act Structure

**Your Current Script:** (empty or minimal)

**Command:** "create three-act structure"

**Result:**
```
ACT I - SETUP

Inciting incident and establishing normal world

ACT II - CONFRONTATION

Rising action, midpoint, and complications

ACT III - RESOLUTION

Climax and resolution
```

### Example 3: Character-Specific Improvements

**Command:** "improve MARCUS's dialogue to sound more cynical"

**Result:** (AI suggests edits with explanations)
```
Original: "I think this might work out."
Suggestion: "Yeah, sure. What could possibly go wrong?"
Reason: Adds cynical tone consistent with character
```

## Getting Help

- **General AI Help:** Click the AI icon and ask "What can you do?"
- **Screenplay Help:** "What are the formatting rules for screenplays?"
- **Feature Questions:** "How do I use the advanced editing tools?"
- **Documentation:** See [AI_DOCUMENT_AWARE_EDITING.md](./AI_DOCUMENT_AWARE_EDITING.md) for technical details

---

**Remember:** The AI is here to help, but you're the creative director. Use these tools to enhance your workflow, but always make the final creative decisions yourself.
