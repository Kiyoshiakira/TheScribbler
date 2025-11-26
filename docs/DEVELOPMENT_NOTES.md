# Development Notes

This document contains development guidelines, future tasks, and technical notes for ScriptScribbler contributors.

## Table of Contents
- [Project Vision](#project-vision)
- [Development Tasks](#development-tasks)
- [Editor Improvements](#editor-improvements)
- [Deferred Complex Tasks](#deferred-complex-tasks)

---

## Project Vision

### App Name: ScriptScribbler (formerly ScriptSync)

### Core Features
- **Script Editor**: Real-time collaborative script editing with standard screenplay formatting
- **Character Management**: Create, manage, and track characters with detailed profiles, tracking which characters appear in which scenes
- **Scene Management**: Organize and manage scenes with drag-and-drop functionality, track scene duration based on word count
- **Collaboration Tools**: Enable multiple users to work on the same script simultaneously with user roles, permissions, and version control
- **Screenplay Formatting**: Automatically format the screenplay according to industry standards
- **AI-Powered Story Tool**: AI tool that reviews existing screenplay, offers potential paths, provides alternatives or missing information (character descriptions, world/environment, sounds, scene descriptions)
- **Export and Sharing**: Export the screenplay in various formats (PDF, Fountain) and provide options for secure sharing

### Style Guidelines
- **Primary color**: Deep blue (#3F51B5) for a professional and creative feel
- **Background color**: Light gray (#EEEEEE) for a clean, distraction-free workspace
- **Accent color**: Teal (#009688) for interactive elements and highlights
- **Body font**: 'Inter' sans-serif for clear and readable text
- **Headline font**: 'Space Grotesk' sans-serif for headings and titles, to draw attention and create hierarchy
- Use minimalistic, line-style icons for a modern and clean look
- Organize the screen with a clear and intuitive layout, providing easy access to essential tools and features
- Use subtle transitions and animations to enhance user experience and provide feedback on interactions

---

## Development Tasks

### High Priority

#### 1. Profile Picture Upload
**Issue**: Users cannot upload their own profile pictures  
**Current State**: Using default avatar or Firebase photo URL  
**Needed**:
- Add profile picture upload in Profile view
- Support image cropping/resizing
- Store in Firebase Storage
- Update user profile with image URL

#### 2. Export Improvements
**Current State**: Basic export functionality exists  
**Needed**:
- PDF export with proper pagination
- Final Draft (.fdx) export/import
- Better formatting options
- Export progress indicator

#### 3. Scene Duration Calculation
**Issue**: Scene duration is not automatically calculated  
**Current State**: Manual entry only  
**Needed**:
- Auto-calculate based on word count (1 page ≈ 1 minute)
- Allow manual override
- Display total script duration
- Show duration in scene cards

#### 4. Collaboration Features
**Current State**: Scripts are viewable by others but no real-time collaboration  
**Needed**:
- Real-time cursor presence
- User roles and permissions
- Comment system
- Change notifications

#### 5. Mobile Responsiveness
**Current State**: Works on mobile but not optimized  
**Needed**:
- Improved mobile editor experience
- Touch-friendly interactions
- Responsive layouts for all tabs
- Mobile-specific navigation

### Medium Priority

#### 6. Enhanced AI Features
**Needed**:
- Character name suggestions based on script context
- Automatic scene summary generation
- Plot hole detection
- Dialogue improvements
- Character arc analysis

#### 7. Search Functionality
**Issue**: No global search across scripts  
**Needed**:
- Search within current script
- Search across all scripts
- Find and replace in editor
- Advanced filters

#### 8. Templates and Presets
**Needed**:
- Script templates (feature, TV, short)
- Character profile templates
- Scene structure templates
- Quick start wizard

#### 9. Import Improvements
**Current State**: Can import .scrite and .scribbler files  
**Needed**:
- Import from Final Draft (.fdx)
- Import from plain text with auto-formatting
- Better error handling
- Import progress indicator

#### 10. Notifications System
**Needed**:
- Script shared notifications
- Comment notifications
- Collaboration invites
- System updates

### Low Priority

#### 11. Dark Mode
**Needed**:
- Dark theme option
- Theme switcher in Settings
- Maintain color consistency
- Save user preference

#### 12. Keyboard Shortcuts
**Current State**: Basic Tab/Enter shortcuts exist  
**Needed**:
- Comprehensive keyboard shortcut system
- Customizable shortcuts
- Shortcut help overlay
- Vim mode (optional)

#### 13. Script Backup/Versioning
**Needed**:
- Automatic version snapshots
- Version comparison
- Restore to previous version
- Export version history

#### 14. Advanced Scene Features
**Needed**:
- Scene color coding
- Scene tags/labels
- Scene filtering
- Scene statistics

#### 15. Character Relationships
**Needed**:
- Visual relationship mapping
- Character interaction tracking
- Relationship timeline
- Conflict tracking

---

## Editor Improvements

### Completed Features
✅ Scene blocks with collapsible sections  
✅ Enhanced Fountain syntax support  
✅ Character management with automatic tracking  
✅ Basic keyboard shortcuts (Tab, Enter, Backspace)  
✅ Find and replace functionality  
✅ Block type cycling  
✅ Scene metadata display  

### Planned Improvements

#### 1. Formatting Enhancements
- **Bold, Italic, Underline**: Add support for Fountain emphasis syntax
- **Dual Dialogue**: Support side-by-side dialogue
- **Notes and Comments**: Support Fountain note syntax `[[ ]]`
- **Boneyard**: Support deleted content storage `/* */`

#### 2. Editor UX
- **Line Numbers**: Optional line number display
- **Page Breaks**: Visual page break indicators
- **Word Count**: Real-time word count display
- **Reading Time**: Estimated reading time
- **Focus Mode**: Distraction-free writing mode

#### 3. Navigation
- **Outline View**: Navigate by scenes/sections
- **Minimap**: Visual overview of script
- **Bookmarks**: Mark important sections
- **Quick Jump**: Jump to scene/character

#### 4. Auto-Formatting
- **Smart Quotes**: Convert straight quotes to curly
- **Auto-Capitalization**: Character names, scene headings
- **Smart Spacing**: Proper spacing after punctuation
- **Auto-Indent**: Intelligent indentation

#### 5. Collaboration
- **Comments**: Add inline comments
- **Suggestions**: Track changes mode
- **Annotations**: Highlight and annotate
- **Revisions**: Color-coded revision marks

---

## Deferred Complex Tasks

These tasks require capabilities beyond the current development scope or involve complex browser-native APIs and external services. They are documented here for future development by human developers or specialized tools.

### Drag-and-Drop Reordering
**Tasks**:
- Reorder scenes in Scene List
- Reorder scenes in Beatboard view
- Reorder outline items
- Reorder chapters in Story Scribbler

**Reason for Deferral**: Requires direct DOM manipulation and browser Drag and Drop API access that cannot be reliably tested in the current development environment. Better handled by developers with live browser access.

### Undo/Redo System
**Tasks**:
- Implement granular undo/redo history stack
- Support undoing multiple operations
- Redo functionality
- History visualization

**Reason for Deferral**: Requires implementing complex state management with Operational Transforms or CRDTs, which is beyond current scope.

### Real-Time Collaboration
**Tasks**:
- Show user cursors in real-time
- Sync edits between users
- Presence indicators
- Conflict resolution

**Reason for Deferral**: Requires implementing CRDTs/Operational Transforms with libraries like Yjs or ShareDB and WebSocket backend. This level of real-time, stateful logic is extremely complex.

### Advanced Import/Export
**Tasks**:
- Final Draft (.fdx) import/export
- Print-ready PDF generation
- PDF with embedded fonts
- Advanced formatting options

**Reason for Deferral**: Parsing proprietary binary formats requires specialized libraries. Generating high-quality PDFs requires server-side rendering with tools like Puppeteer.

### Print/Pagination Preview
**Tasks**:
- "View: Pagination" mode
- Accurate page break simulation
- Industry-standard formatting (55 lines/page)
- Print preview

**Reason for Deferral**: Highly visual task requiring calculation of rendered line heights, font metrics, and element dimensions in live browser context.

### Performance Optimization
**Tasks**:
- List virtualization for large scripts
- Code splitting
- Lazy loading
- Performance profiling

**Reason for Deferral**: While code can be written, proper implementation requires performance profiling and fine-tuning in real browser environment.

### Offline Editing
**Tasks**:
- Offline editing with IndexedDB
- Background sync
- Conflict resolution UI
- Offline indicator

**Reason for Deferral**: Complex stateful feature involving browser-specific storage APIs and extensive testing in various online/offline scenarios.

### Version History & Snapshots
**Tasks**:
- Create script snapshots
- View version timeline
- Compare versions (diff view)
- Restore previous versions

**Reason for Deferral**: Significant backend logic for storing deltas or full snapshots, plus complex UI for viewing timeline and diffing versions.

### Cloud Storage Integrations
**Tasks**:
- Google Drive sync
- Dropbox sync
- OneDrive sync
- Auto-sync on changes

**Reason for Deferral**: Requires complex OAuth 2.0 flows, API-specific SDKs, token management, and background synchronization logic.

### Guided Tour/Onboarding
**Tasks**:
- Interactive tutorial for new users
- Feature highlights
- Step-by-step guide
- Context-sensitive help

**Reason for Deferral**: Creating effective guided tour requires designing flow based on final interactive UI with libraries like Shepherd.js.

### Testing & CI/CD
**Tasks**:
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright
- GitHub Actions CI pipeline
- Automated deployment

**Reason for Deferral**: Cannot interact with external services to configure test runners or create CI workflow files.

### Error Reporting
**Tasks**:
- Integrate error tracking (Sentry, LogRocket)
- User error reporting button
- Automatic error capture
- Error analytics

**Reason for Deferral**: Requires integration with third-party services including API keys and service-specific formatting.

---

## Technical Guidelines

### Code Style
- Follow existing TypeScript patterns
- Use React hooks over class components
- Implement proper error handling
- Add TypeScript types for all functions
- Write self-documenting code with clear names

### Component Structure
- Keep components focused and single-purpose
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Separate presentation from business logic

### State Management
- Use React hooks for local state
- Firebase/Firestore for persistent data
- Context for shared state across components
- Avoid prop drilling

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Lazy load heavy components
- Optimize Firestore queries

### Accessibility
- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

### Testing Strategy
- Test critical user paths
- Mock Firebase in tests
- Test error states
- Verify accessibility
- Check responsive behavior

---

## Contributing

### Getting Started
1. Read the README.md for setup instructions
2. Review the wiki for feature documentation
3. Check existing issues before creating new ones
4. Follow the code style guidelines
5. Write clear commit messages

### Pull Request Process
1. Create a feature branch from main
2. Make focused, incremental changes
3. Test your changes thoroughly
4. Update documentation as needed
5. Submit PR with clear description
6. Address code review feedback

### Reporting Issues
- Use issue templates when available
- Provide clear reproduction steps
- Include screenshots for UI issues
- Specify environment details
- Search for existing issues first

---

## Resources

### Documentation
- [README.md](../README.md) - Getting started guide
- [Wiki](../wiki/) - Comprehensive documentation
- [Implementation History](IMPLEMENTATION_HISTORY.md) - Past implementations

### External Resources
- [Fountain Syntax](https://fountain.io/) - Screenplay markup language
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and general discussion
- Pull Requests - Code contributions

---

**Last Updated**: November 2024  
**Status**: Active Development  
**Next Focus**: Profile picture upload, improved exports, scene duration calculation
