# Story Scribbler - Tab-Based Story Writing Tool

## Overview
The Story Scribbler has been transformed from a placeholder view into a fully functional tab-based story writing tool with six organized tabs for comprehensive story development.

## Tab Structure

### 1. Outline Tab
**Purpose**: Story structure and plot organization
- Create hierarchical outline items with nested structure
- Expandable/collapsible sections for better organization
- Order management for story beats
- Description field for detailed notes

**Features**:
- Add/Edit/Delete outline items
- Visual hierarchy with indentation
- Drag handle for future reordering support
- Empty state prompts

### 2. Chapters Tab
**Purpose**: Managing story chapters and sections
- Chapter title and summary
- Full chapter content writing area
- Automatic word count tracking
- Chapter ordering

**Features**:
- Card-based chapter overview
- Badge showing chapter number
- Word count display per chapter and total
- Full-featured chapter editor with summary and content
- Edit/Delete chapter functionality

### 3. Characters Tab
**Purpose**: Story-focused character development
- Character profiles with detailed information
- Role categorization (Protagonist, Antagonist, Supporting, Minor, Other)
- Image upload support
- Multiple character attributes

**Features**:
- Visual character cards with avatars
- Personality, background, and goals tracking
- Role-based organization
- Character image upload
- Delete confirmation

### 4. World Building Tab
**Purpose**: Settings, locations, and lore management
- Multiple world element types:
  - Location
  - Culture
  - Technology
  - Magic System
  - Organization
  - Historical Event
  - Other

**Features**:
- Category filtering
- Image support for world elements
- Significance to story field
- Detailed descriptions
- Card-based visual display

### 5. Timeline Tab
**Purpose**: Tracking events chronologically
- Event categorization (Plot, Character, World, Flashback, Foreshadowing, Other)
- Timeframe specification
- Visual timeline with connecting line
- Order management

**Features**:
- Visual timeline with connector line
- Category badges
- Time-based organization
- Category filtering
- Edit/Delete event functionality

### 6. Story Notes Tab
**Purpose**: General story ideas and research
- Multiple note categories:
  - Ideas
  - Research
  - Plot
  - Character
  - Setting
  - Themes
  - Dialogue
  - General

**Features**:
- Tag support for better organization
- Category-based filtering
- Full-text content area
- Card-based display with preview
- Tag visualization (showing up to 3 tags per card)

## Technical Implementation

### Component Structure
```
story-scribbler-view.tsx (main container with tabs)
├── story-tabs/
│   ├── outline-tab.tsx
│   ├── chapters-tab.tsx
│   ├── story-characters-tab.tsx
│   ├── world-building-tab.tsx
│   ├── timeline-tab.tsx
│   └── story-notes-tab.tsx
```

### Key Features Across All Tabs
1. **Firestore Integration**: Each tab stores data in its own collection under the current script
2. **CRUD Operations**: Full Create, Read, Update, Delete functionality
3. **Loading States**: Skeleton screens during data fetch
4. **Empty States**: Helpful prompts when no data exists
5. **Error Handling**: Permission errors and user-friendly error messages
6. **Responsive Design**: Works on desktop and mobile devices
7. **Dialog-based Editing**: Modal forms for adding/editing items
8. **Toast Notifications**: Success and error feedback

### Firestore Collections
Each tab creates its own collection under: `/users/{userId}/scripts/{scriptId}/`
- `outline` - Story outline items
- `chapters` - Story chapters
- `storyCharacters` - Story characters (separate from script characters)
- `worldBuilding` - World building elements
- `timeline` - Timeline events
- `storyNotes` - Story notes

### UI Components Used
- Radix UI Tabs for tab navigation
- Cards for item display
- Dialogs for editing
- Buttons, Inputs, Textareas, Selects
- Badges for categorization
- Skeletons for loading states
- Toast notifications for feedback

## Responsive Behavior
- Tab labels hide on small screens (icons only)
- Grid layouts adjust for different screen sizes
- Dialogs are scrollable on mobile
- Touch-friendly interactions

## Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- Focus management in dialogs
- Semantic HTML structure
- ARIA attributes where needed

## Future Enhancements (Possible)
1. Drag-and-drop reordering
2. Export/import functionality
3. AI-powered suggestions for each tab
4. Cross-referencing between tabs
5. Rich text editing for content fields
6. Collaborative editing
7. Version history
8. Search and filter across all tabs
