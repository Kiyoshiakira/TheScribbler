# AI Editor Functionality

This document describes the AI-powered editing features added to ScriptScribbler.

## Overview

The AI editor functionality allows writers to get intelligent assistance while writing their screenplays. The AI can help with:

- **Spelling and grammar corrections**
- **Dialogue improvements** - Making dialogue sound more natural and engaging
- **Action descriptions** - Enhancing visual clarity of action lines
- **Creative suggestions** - Getting help with pacing, character voice, and story structure
- **Auto-complete** - Smart suggestions for completing sentences and continuing scenes

## Features

### 1. Context Menu AI Editing

**How to use:**
1. Select any text in the editor
2. Right-click on the selected text
3. Choose from quick AI editing options:
   - Fix Spelling & Grammar
   - Improve Clarity
   - Enhance Dialogue
   - Polish Action

The AI will analyze the selected text and provide suggestions that you can apply or dismiss.

### 2. AI Chat Assistant

**How to use:**
1. Click the AI FAB (floating action button) in the bottom-right corner
2. Select "Open AI Chat"
3. Ask the AI to edit your script with natural language commands like:
   - "Fix the spelling errors in this scene"
   - "Make the dialogue more natural"
   - "Improve the action description"
   - "Edit this to be clearer"

The AI will analyze your request and provide editing suggestions or directly modify the script.

### 3. AI Writing Assistance Toggle

**How to use:**
1. Look for the "AI Assist" button in the editor status bar (bottom of the editor)
2. Click to toggle AI writing assistance on/off
3. When enabled, the AI can provide real-time suggestions (future feature)

The toggle shows:
- **Green highlight**: AI assistance is ON
- **Grey**: AI assistance is OFF

### 4. Proofreading

**How to use:**
1. Click the AI FAB button
2. Select "Proofread Script"
3. Review the suggestions for:
   - Spelling errors
   - Grammar mistakes
   - Formatting issues
   - Continuity problems

Each suggestion shows:
- The original text
- The corrected version
- An explanation of why the change is suggested

You can apply or dismiss each suggestion individually.

## AI Flows

### ai-edit-script.ts

The main AI flow for intelligent script editing. It analyzes screenplay content and provides context-aware suggestions.

**Input:**
- `instruction`: User's editing request (e.g., "fix spelling")
- `targetText`: Optional specific text to edit
- `context`: Surrounding screenplay blocks for context
- `selectionStart/End`: Optional character positions

**Output:**
- `suggestions`: Array of edit suggestions with:
  - `originalText`: Text to replace
  - `editedText`: Improved version
  - `reason`: Why this improves the script
  - `confidence`: high/medium/low

### ai-writing-assist.ts

Provides auto-complete and writing continuation suggestions.

**Input:**
- `currentBlock`: The block being edited
- `cursorPosition`: Current cursor position
- `precedingBlocks`: Previous blocks for context
- `assistType`: complete/suggest/continue

**Output:**
- `suggestions`: Array of writing suggestions with confidence scores

### ai-agent-orchestrator.ts (Enhanced)

The main AI orchestrator now recognizes editing requests and routes them to the appropriate AI flows.

Detects keywords like:
- edit, improve, fix, change, rewrite
- spelling, grammar
- dialogue, action
- clearer, stronger, more natural

## Components

### AiEditContextMenu

A context menu that appears when you right-click selected text. Provides quick access to common AI editing actions.

**Props:**
- `selectedText`: The text to edit
- `context`: Surrounding blocks for context
- `onApplyEdit`: Callback when user accepts a suggestion
- `onClose`: Callback to close the menu
- `position`: Screen coordinates for menu placement

### AiWritingSuggestions

Shows inline AI writing suggestions as you type (future enhancement).

**Props:**
- `currentBlock`: Current block being edited
- `cursorPosition`: Cursor position
- `precedingBlocks`: Context blocks
- `onAcceptSuggestion`: Callback when user accepts
- `isEnabled`: Whether suggestions are active

## How It Works

1. **User Action**: User selects text and right-clicks, or asks the AI via chat
2. **Request Analysis**: The AI orchestrator analyzes the request
3. **Context Gathering**: Relevant screenplay blocks are collected
4. **AI Processing**: The appropriate AI flow processes the request
5. **Suggestion Display**: Suggestions are shown to the user
6. **User Choice**: User can apply, modify, or dismiss suggestions

## Best Practices

### For Users

1. **Be specific**: "Fix spelling in this scene" is better than just "fix this"
2. **Select wisely**: Select the specific text you want to edit for best results
3. **Review suggestions**: AI suggestions are helpful but not always perfect
4. **Maintain your voice**: Use AI as an assistant, not a replacement for your creativity

### For Developers

1. **Context is key**: Always provide surrounding blocks for better AI suggestions
2. **Confidence matters**: Only auto-apply suggestions with high confidence
3. **Preserve intent**: Editing should enhance, not replace, the writer's vision
4. **Debounce requests**: Avoid overwhelming the AI with too many requests

## Configuration

AI writing assistance can be configured via the `useAiWritingAssist` hook:

```typescript
const { config, toggleEnabled, setMinConfidence } = useAiWritingAssist();

// Toggle AI on/off
toggleEnabled();

// Set minimum confidence threshold (0-1)
setMinConfidence(0.7); // Only show suggestions with 70%+ confidence
```

Configuration is persisted in localStorage.

## Future Enhancements

- Real-time auto-complete as you type
- Character voice consistency checking
- Scene structure analysis
- Collaborative editing with AI suggestions
- Custom AI editing commands
- Learning from user preferences

## Scene Management Features

### Add Scene Button

The editor now includes an "Add Scene" button positioned below the editor content. This allows writers to:
- Quickly add a new scene heading at the end of the script
- Continue writing without manually creating a new SCENE_HEADING block
- Maintain workflow without switching between tabs

**How to use:**
1. Scroll to the bottom of the editor
2. Click the "Add Scene" button
3. A new scene heading will be inserted with placeholder text: "INT. NEW LOCATION - DAY"
4. Edit the scene heading to match your needs

### End Scene Functionality

Each scene block in the editor now includes an "End Scene" button that appears below the scene content. This feature:
- Marks a scene as complete
- Provides visual feedback that the scene is finished
- Enables the "Edit Scene" functionality

**How to use:**
1. Write your scene content in the editor
2. When finished, click the "End Scene" button at the bottom of the scene block
3. The button will be replaced with "Scene ended" text and an "Edit Scene" button

### Edit Scene

After ending a scene, writers can edit the scene's metadata using the "Edit Scene" button. This provides:
- Quick access to scene details
- Ability to modify scene setting, description, and estimated time
- Integration with the Scenes tab for comprehensive scene management

**How to use:**
1. Click "End Scene" on a completed scene
2. Click "Edit Scene" that appears
3. You'll be directed to edit the scene in the Scenes tab where you can modify:
   - Scene setting (e.g., "INT. COFFEE SHOP - DAY")
   - Scene description
   - Estimated time in minutes

**Note:** For detailed scene management, including viewing all scenes in list or beatboard view, navigate to the Scenes tab in the sidebar.

## Technical Details

### AI Model

Uses Google's Gemini 2.5 Flash model via Genkit for:
- Fast response times
- High-quality suggestions
- Context-aware editing

### Temperature Settings

- **Proofreading**: 0.1 (deterministic, focused on correctness)
- **Editing**: 0.3 (balanced between consistency and creativity)
- **Writing Assistance**: 0.7 (more creative for suggestions)

### Error Handling

All AI flows include:
- Graceful fallbacks if AI is unavailable
- User-friendly error messages
- Offline support (features disabled)

## Privacy & Data

- AI requests are sent to Google's Gemini API
- No screenplay data is stored by the AI service
- All suggestions are processed in real-time
- Users maintain full control over their content
