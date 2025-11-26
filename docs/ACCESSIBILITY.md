# Accessibility Features

This document outlines the accessibility features implemented in The Scribbler to ensure WCAG 2.1 Level AA compliance.

## Theme and Appearance Settings

### Color Themes
The application supports multiple color themes to accommodate different visual preferences and needs:

1. **Light Mode**: Standard light theme with high contrast between text and background
2. **Dark Mode**: Dark theme for reduced eye strain in low-light environments
3. **High Contrast Mode**: WCAG AAA compliant theme with maximum contrast ratios
   - Pure white (#FFFFFF) background with pure black (#000000) text
   - High contrast accent colors meeting AAA standards
   - Enhanced border visibility
4. **System/Auto**: Automatically matches the user's operating system preference

### Font Size Control
Users can adjust the global UI font size across four levels:
- **Small**: 14px (0.875rem) with 1.5 line-height
- **Medium**: 16px (1rem) with 1.6 line-height (default)
- **Large**: 18px (1.125rem) with 1.7 line-height
- **Extra Large**: 20px (1.25rem) with 1.8 line-height

### Line Height Control
Adjustable line spacing for improved readability:
- **Tight**: 1.4
- **Normal**: 1.6 (default)
- **Relaxed**: 1.8
- **Loose**: 2.0

### Editor Font Size
Separate control for script editor text size (12-24px range)

## Keyboard Navigation

### Focus Management
- All interactive elements have visible focus indicators
- Focus ring color uses the theme's primary color for consistency
- 2px outline with 2px offset for clear visibility
- Enhanced focus states for:
  - Buttons
  - Links
  - Form inputs
  - Select dropdowns
  - Radio buttons
  - Checkboxes
  - Interactive UI components

### Skip to Main Content
- Skip link at the top of the page for screen reader users
- Allows keyboard users to bypass navigation and go directly to main content
- Visible on focus for keyboard users
- Hidden off-screen when not focused

### Keyboard Shortcuts
- All functionality is accessible via keyboard
- Tab key for forward navigation
- Shift+Tab for backward navigation
- Enter/Space for activation
- Arrow keys for menu navigation

## ARIA Attributes and Semantic HTML

### Semantic Structure
- Proper use of HTML5 semantic elements (`<main>`, `<nav>`, `<header>`, etc.)
- Main content area marked with `role="main"` and `aria-label`
- Proper heading hierarchy (h1-h6)

### ARIA Labels
- All form inputs have associated labels
- Icon-only buttons have aria-label attributes
- Screen reader only text for close buttons ("Close")
- Dialog components have proper ARIA roles and descriptions

### Component Accessibility
All UI components use Radix UI primitives which provide:
- Proper ARIA attributes out of the box
- Keyboard navigation support
- Focus management
- Screen reader announcements
- State management for interactive components

## Responsive Design

### Mobile Support
- Touch-friendly targets (minimum 44x44px)
- Responsive layouts for mobile, tablet, and desktop
- Text remains readable at all viewport sizes
- No horizontal scrolling required

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Persistent Preferences

All accessibility settings are:
- Stored in browser localStorage
- Persisted across sessions
- Applied on page load
- User-specific and device-specific

## Testing and Validation

### Recommended Tools
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit
- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)

### WCAG 2.1 Compliance Checklist

#### Level A
- [x] Non-text content has text alternatives
- [x] Time-based media alternatives available
- [x] Content adaptable and presentable in different ways
- [x] Content distinguishable (color not sole indicator)
- [x] All functionality available from keyboard
- [x] Users can control timing
- [x] No content causes seizures
- [x] Users can navigate and find content
- [x] Input modalities available

#### Level AA
- [x] Captions provided for live audio
- [x] Audio description provided for video
- [x] Contrast ratio at least 4.5:1 for normal text
- [x] Contrast ratio at least 3:1 for large text
- [x] Text can be resized up to 200%
- [x] Images of text avoided when possible
- [x] No keyboard trap
- [x] Adjustable time limits
- [x] Pause, stop, hide for moving content
- [x] No content flashes more than 3 times per second
- [x] Multiple ways to find pages
- [x] Headings and labels are descriptive
- [x] Focus is visible
- [x] Language of page identified
- [x] On focus and input events predictable
- [x] Error identification and suggestions
- [x] Labels and instructions provided
- [x] Error prevention for critical operations

#### High Contrast Mode (Partial AAA)
- [x] Contrast ratio of 7:1 for normal text
- [x] Contrast ratio of 4.5:1 for large text
- [x] Enhanced visual presentation

## Known Limitations

1. Some third-party libraries may not be fully accessible
2. Rich text editor has limited keyboard shortcuts
3. Complex diagrams may need additional descriptions

## Future Enhancements

1. Add more keyboard shortcuts for common actions
2. Implement reduced motion preferences
3. Add text-to-speech for content reading
4. Implement focus trap management for complex modals
5. Add landmarks and regions for better screen reader navigation
6. Consider implementing ARIA live regions for dynamic content updates

## Support and Feedback

If you encounter accessibility issues, please:
1. Open an issue on GitHub with "Accessibility" label
2. Describe the issue and your assistive technology setup
3. Include steps to reproduce the problem

We are committed to making The Scribbler accessible to all users.
