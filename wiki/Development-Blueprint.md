# Development Blueprint

This document outlines the core vision, style guidelines, and design principles for ScriptScribbler.

## Project Vision

**Mission:** Create a modern, collaborative screenwriting application that combines powerful editing tools with AI-powered assistance to help writers bring their stories to life.

**Core Values:**
1. **Writer-First**: Every feature serves the writer's creative process
2. **Simplicity**: Clean, distraction-free workspace
3. **Professional**: Industry-standard formatting and features
4. **Intelligent**: AI assists but never replaces creativity
5. **Accessible**: Easy to learn, powerful to master

## Core Features

### 1. Script Editor
Real-time collaborative script editing with standard screenplay formatting.

**Key Aspects:**
- Industry-standard Fountain syntax support
- Automatic formatting
- Scrite-like scene organization
- Find and replace
- Keyboard shortcuts
- Auto-save

### 2. Character Management
Create, manage, and track characters with detailed profiles.

**Key Aspects:**
- Automatic character creation from dialogue
- Scene appearance tracking
- Character persistence (Scrite-inspired)
- AI-generated profiles and portraits
- Independent character database

### 3. Scene Management
Organize and manage scenes with drag-and-drop functionality.

**Key Aspects:**
- Scene list and beatboard views
- Metadata (setting, time, description)
- Reordering capabilities
- Time estimation
- Scene grouping in editor

### 4. Collaboration Tools
Enable multiple users to work together (future enhancement).

**Key Aspects:**
- User roles and permissions
- Version control
- Comments and suggestions
- Real-time collaboration (planned)

### 5. Screenplay Formatting
Automatically format according to industry standards.

**Key Aspects:**
- Fountain syntax parsing
- Industry-standard indentation
- Proper margins and spacing
- Element detection
- Professional output

### 6. AI-Powered Story Tool
AI tool that assists with screenplay development.

**Key Aspects:**
- Review existing screenplay
- Suggest potential story paths
- Provide alternatives
- Generate missing information
- Character descriptions
- World/environment details
- Scene descriptions

### 7. Export and Sharing
Export screenplay in various formats and share securely.

**Key Aspects:**
- Multiple format support (PDF, Fountain, Final Draft)
- Native `.scribbler` format
- Public sharing URLs
- Portfolio presentation
- Print-ready output

## Design Philosophy

### User Experience

**Principles:**
1. **Minimalism**: Remove unnecessary elements
2. **Clarity**: Clear visual hierarchy
3. **Efficiency**: Fast access to essential tools
4. **Feedback**: Immediate visual feedback on actions
5. **Consistency**: Uniform patterns throughout

**Inspiration:**
- Scrite (screenplay software)
- VS Code (editor interface)
- Notion (organization)
- Google Docs (collaboration)

### Visual Design

**Design System:**
- Clean, modern aesthetic
- Professional appearance
- Distraction-free writing environment
- Subtle animations and transitions
- Accessibility considerations

## Style Guidelines

### Color Palette

**Primary Colors:**
- **Deep Blue**: `#3F51B5` - Professional and creative feel
- **Teal**: `#009688` - Interactive elements and highlights
- **Light Gray**: `#EEEEEE` - Clean background

**Usage:**
- Primary color for branding and main actions
- Accent color for interactive elements
- Background color for workspace

**Additional Colors:**
- Muted tones for text
- Bright accents for success/error states
- Neutral grays for UI elements

### Typography

**Fonts:**
- **Body Font**: 'Inter' sans-serif - Clear and readable
- **Headline Font**: 'Space Grotesk' sans-serif - Attention and hierarchy
- **Monospace**: 'Courier New' - Screenplay text (industry standard)

**Hierarchy:**
- Large, bold headlines
- Medium subheadings
- Body text at comfortable reading size
- Small text for metadata

**Screenplay Specific:**
- 12pt Courier New for all screenplay elements
- Fixed-width font for proper alignment
- Industry-standard sizing

### Icons

**Style:**
- Minimalistic line-style icons
- Modern and clean look
- Consistent stroke width
- Clear at small sizes

**Sources:**
- Lucide Icons (primary)
- Custom icons when needed
- Consistent style across app

### Layout

**Screen Organization:**
- **Left Sidebar**: Navigation tabs
- **Main Area**: Content workspace
- **Right Panel**: AI assistant (when open)
- **Top Header**: Title, actions, user menu
- **Bottom Bar**: Status and metadata

**Spacing:**
- Generous whitespace
- Clear section separation
- Breathing room for content
- Comfortable reading width

### Animations & Transitions

**Principles:**
- Subtle and purposeful
- Enhance understanding
- Provide feedback
- Never distract
- Smooth and natural

**Usage:**
- Fade in/out for modals
- Slide for panel transitions
- Bounce for confirmations
- Hover effects for interactivity

**Timing:**
- Fast: 150-200ms
- Medium: 250-350ms
- Slow: 400-500ms

## Technical Architecture

### Technology Choices

**Frontend:**
- **Framework**: Next.js - React-based, server-side rendering
- **Language**: TypeScript - Type safety and developer experience
- **Styling**: Tailwind CSS - Utility-first, rapid development
- **UI**: shadcn/ui components - Accessible, customizable

**Backend:**
- **Database**: Firebase Firestore - Real-time, scalable NoSQL
- **Auth**: Firebase Authentication - Secure, easy integration
- **AI**: Google Gemini via Genkit - Powerful, cost-effective
- **Storage**: Firebase Storage - File uploads and assets

**Why These Choices:**
1. **Next.js**: Best-in-class React framework, great DX
2. **TypeScript**: Catch errors early, better IDE support
3. **Tailwind**: Rapid styling, consistent design system
4. **Firebase**: Managed backend, real-time capabilities
5. **Gemini**: Advanced AI at reasonable cost

### Architectural Patterns

**Patterns Used:**
- Single-Page Application (SPA)
- Context API for state management
- Component composition
- Custom hooks for reusability
- Utility-first styling

**Code Organization:**
- Feature-based folder structure
- Shared components in `components/`
- Utilities in `lib/`
- AI flows in `ai/flows/`
- Contexts in `context/`

## Development Principles

### Code Quality

**Standards:**
- TypeScript for all code
- ESLint for code quality
- Prettier for formatting
- Meaningful variable names
- Clear comments when needed

**Testing:**
- Unit tests for utilities
- Integration tests for flows
- Manual testing for UI
- CodeQL security scanning

### Performance

**Optimizations:**
- Code splitting
- Lazy loading
- Memoization
- Debouncing
- Efficient re-renders

**Monitoring:**
- Build size tracking
- Performance profiling
- User experience metrics (future)

### Security

**Practices:**
- Environment variables for secrets
- Firebase security rules
- Input validation
- XSS prevention
- HTTPS only

### Accessibility

**Considerations:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast

## Feature Development Guidelines

### Adding New Features

**Process:**
1. **Plan**: Define scope and requirements
2. **Design**: Create mockups or wireframes
3. **Implement**: Write code following standards
4. **Test**: Verify functionality and edge cases
5. **Document**: Update relevant documentation
6. **Review**: Code review and feedback
7. **Deploy**: Gradual rollout

### Feature Flags

**Usage:**
- New features behind flags
- Gradual rollout capability
- A/B testing support
- Easy rollback

### User Feedback

**Incorporation:**
- Regular user testing
- Feedback collection
- Iterative improvements
- Community input

## Roadmap Priorities

### High Priority

1. ✅ Scene blocks (Scrite-like)
2. ✅ Enhanced Fountain syntax
3. ✅ Character persistence
4. ✅ AI-powered editing
5. ✅ Multiple export formats

### Medium Priority

1. Real-time collaboration
2. Version history
3. Comments and annotations
4. Mobile optimization
5. Offline mode

### Low Priority

1. Custom themes
2. Plugin system
3. Advanced analytics
4. Team workspaces
5. API for integrations

## Success Metrics

### User Engagement

**Metrics:**
- Daily active users
- Scripts created
- AI feature usage
- Export frequency
- User retention

### Technical Health

**Metrics:**
- Build times
- Error rates
- Performance scores
- Security scan results
- Code coverage

### Business Goals

**Metrics:**
- User growth
- Feature adoption
- User satisfaction
- Community engagement
- Industry recognition

## Contributing Guidelines

### For Contributors

**Process:**
1. Fork the repository
2. Create feature branch
3. Make changes following guidelines
4. Test thoroughly
5. Submit pull request
6. Address review feedback

**Standards:**
- Follow code style guidelines
- Write clear commit messages
- Update documentation
- Add tests when applicable
- Be respectful and constructive

### Code Review

**Criteria:**
- Code quality and readability
- Test coverage
- Performance impact
- Security considerations
- Documentation completeness

## Future Vision

### Long-term Goals

**Year 1:**
- Stable, feature-rich editor
- Growing user base
- Strong AI integration
- Multiple export formats
- Professional recognition

**Year 2:**
- Real-time collaboration
- Mobile apps
- Plugin ecosystem
- Team features
- Industry partnerships

**Year 3:**
- Market leader in cloud screenwriting
- Advanced AI capabilities
- Professional production tools
- Global user community
- Revenue positive

---

**Related Pages:**
- [Application Architecture](Application-Architecture) - Technical structure
- [Development Tasks](Development-Tasks) - Specific improvements
- [Implementation Overview](Implementation-Overview) - Recent changes

---

**🎯 Vision Statement:** ScriptScribbler aims to be the most intuitive, powerful, and AI-enhanced screenwriting tool for modern storytellers.
