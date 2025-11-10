# Development Tasks & Improvements

This page lists planned improvements, enhancements, and tasks for ScriptScribbler development.

## High Priority Tasks

### 1. Error Handling & User Experience

#### Add Error Boundary for Editor
**Problem:** Editor tab sometimes doesn't load due to render errors

**Solution:**
- Create `ErrorBoundary.tsx` component
- Wrap editor view to prevent full tab collapse
- Show friendly error messages
- Add detailed logging for debugging

**Files:** `src/components/ErrorBoundary.tsx`, editor container

---

#### Improve Missing API Key Handling
**Problem:** UI can break when `GEMINI_API_KEY` is missing

**Solution:**
- Add `NEXT_PUBLIC_AI_ENABLED` flag
- Show "AI disabled" state in UI
- Disable AI buttons gracefully
- Non-blocking UI degradation

**Files:** `src/app/actions.ts`, AI components

---

### 2. Code Quality & Maintenance

#### Centralize Constants
**Problem:** Duplicate `SCRIPT_TOKEN_LIMIT` constant

**Solution:**
- Create `src/constants.ts`
- Export `SCRIPT_TOKEN_LIMIT = 1_000_000`
- Update all imports

**Files:** `src/constants.ts`, `src/ai/flows/ai-proofread-script.ts`, `src/app/actions.ts`

---

#### Rename Action Wrappers
**Problem:** Confusion between flow exports and action wrappers

**Solution:**
- Rename to `runAiReformatScript`, `runAiProofreadScript`, etc.
- Update all imports across app
- Clear naming convention

**Files:** `src/app/actions.ts`, all importing components

---

#### Remove Unused Imports
**Problem:** Code has unused imports

**Solution:**
- Run ESLint to find unused imports
- Remove or use as intended
- Clean up `package.json` if needed

**Command:** `npm run lint`

---

### 3. Firebase & Data

#### Verify Batch Writes Include Commit
**Problem:** `writeBatch` may be missing `commit()`

**Solution:**
- Ensure `await batch.commit()` is called
- Add error handling for batch operations
- Test Scrite file import

**Files:** `src/components/layout/app-header.tsx`, import flow

---

#### Improve Firestore Rules
**Problem:** Permission denied errors can break editor

**Solution:**
- Ensure rules restrict writes appropriately
- Allow reads for authenticated owners
- Add client-side permission checks
- Show descriptive error messages

**Files:** `firestore.rules`, UI components

---

## Medium Priority Tasks

### 4. AI Improvements

#### Add AI Output Validation
**Problem:** Zod validation throws on unexpected AI output

**Solution:**
- Wrap AI calls to catch validation errors
- Log raw responses (sanitized)
- Return helpful error messages
- Store recent outputs in logs

**Files:** AI flow files (`src/ai/flows/*.ts`)

---

#### Configurable AI Model
**Problem:** Want to use different Gemini models

**Solution:**
- Add `GEMINI_MODEL` environment variable
- Default to current model
- Update Genkit initialization
- Document model options

**Files:** `src/ai/genkit.ts`

---

#### Add AI Request Timeouts
**Problem:** UI can hang on long AI requests

**Solution:**
- Add configurable timeout
- Return timeout error to UI
- Show retry/cancel UI
- Use `AbortController` for cancellation

**Files:** `src/app/actions.ts`, client API calls

---

### 5. Testing & CI

#### Add Automated Tests
**Problem:** Lack of automated tests

**Solution:**
- Unit tests for actions and flows
- Integration tests for editor
- Mock AI responses
- Add CI test step

**Files:** Create `tests/` directory, GitHub Actions workflow

---

#### Add Linting in CI
**Problem:** Code style issues can creep in

**Solution:**
- Configure ESLint + Prettier
- Add pre-commit hooks
- Run in CI: `tsc --noEmit` check
- Enforce code standards

**Files:** `.github/workflows/ci.yml`, `.eslintrc`, Prettier config

---

### 6. Performance

#### Optimize Editor Performance
**Problem:** Large scripts may render slowly

**Solution:**
- Virtualize line rendering
- Debounce expensive operations
- Memoize heavy computations
- Profile and optimize

**Files:** Editor component, context hooks

---

#### Improve Proofread UI Performance
**Problem:** Large suggestion lists can be heavy

**Solution:**
- Virtualize long lists (react-window)
- Add batch-apply option
- Quick "apply correction" buttons
- Preview-only mode

**Files:** `src/components/ai-fab.tsx`, proofreading UI

---

## Low Priority Tasks

### 7. Features & Enhancements

#### Add Accessibility Improvements
**Problem:** UX improvements needed

**Solution:**
- Ensure ARIA roles on editor elements
- Keyboard navigation for AI panels
- Screen reader support
- Color contrast compliance

**Files:** Editor component, AI UI components

---

#### Add Feature Flags
**Problem:** Need safe rollout capability

**Solution:**
- Add `FEATURE_AI` environment flag
- Toggle UI controls and endpoints
- Enable gradual rollout
- Easy disable for issues

**Files:** `src/app/actions.ts`, UI components

---

#### Improve Import Flow
**Problem:** Import might fail silently

**Solution:**
- Add file validation
- Use transactions for imports
- Show progress indicator
- Success/failure details

**Files:** `src/components/layout/app-header.tsx`, import utilities

---

#### Add Error Reporting UI
**Problem:** Users can't report errors

**Solution:**
- "Report error" button in error boundaries
- Pre-fill logs and environment
- Create feedback Firestore collection
- Or integrate with issue tracker

**Files:** ErrorBoundary, report UI

---

### 8. Documentation

#### Improve Developer Setup Docs
**Problem:** Onboarding can be painful

**Solution:**
- Add detailed README section
- Document env variables
- Debugging tips
- Common issues section

**Files:** `README.md` or `docs/DEV_SETUP.md`

---

#### Document Troubleshooting Steps
**Problem:** Editor not loading - hard to debug

**Solution:**
- Console logs to watch
- Common error solutions
- Firebase setup issues
- AI key configuration

**Files:** Wiki troubleshooting page

---

## Future Enhancements

### Long-term Features

1. **Real-time Collaboration**
   - Multiple users editing simultaneously
   - Presence indicators
   - Conflict resolution
   - Version history

2. **Mobile Optimization**
   - Responsive design improvements
   - Touch-optimized controls
   - Mobile-first editor
   - Progressive Web App

3. **Offline Mode**
   - Local storage sync
   - Offline editing
   - Background sync when online
   - Conflict handling

4. **Version History**
   - Automatic snapshots
   - Compare versions
   - Restore previous versions
   - Branch and merge

5. **Comments & Annotations**
   - Inline comments
   - Threaded discussions
   - Resolve/unresolve
   - Mention other users

6. **Plugin System**
   - Custom extensions
   - Third-party integrations
   - Theme marketplace
   - AI model plugins

7. **Advanced Analytics**
   - Writing statistics
   - Productivity insights
   - Character analysis
   - Story structure visualization

8. **Team Workspaces**
   - Organization accounts
   - Role-based permissions
   - Shared script libraries
   - Team collaboration tools

## Development Best Practices

### Before Starting a Task

1. ✅ Understand the problem fully
2. ✅ Review related code
3. ✅ Plan the implementation
4. ✅ Create small, focused PRs
5. ✅ Write tests when applicable

### During Development

1. ✅ Follow code style guidelines
2. ✅ Write clear commit messages
3. ✅ Test thoroughly
4. ✅ Document changes
5. ✅ Review your own code first

### After Completing a Task

1. ✅ Run linter and type checker
2. ✅ Manual testing
3. ✅ Update documentation
4. ✅ Request code review
5. ✅ Address review feedback

## Task Management

### PR Guidelines

**Each PR Should:**
- Address one logical change
- Include clear description
- List files changed
- Document tests added
- Provide manual test steps

**PR Title Format:**
```
[Type] Brief description

Examples:
[Feature] Add error boundary for editor
[Fix] Resolve duplicate constant issue
[Docs] Update installation guide
[Refactor] Centralize constants
```

### Branch Naming

**Convention:**
```
type/short-description

Examples:
feature/error-boundary
fix/duplicate-constant
docs/setup-guide
refactor/action-wrappers
```

### Commit Messages

**Format:**
```
Brief summary (50 chars or less)

Detailed explanation if needed:
- Why the change was made
- What problem it solves
- Any side effects or considerations
```

## Priority Legend

| Priority | Timeframe | Impact |
|----------|-----------|--------|
| 🔴 High | 1-2 weeks | Critical or major improvement |
| 🟡 Medium | 1-2 months | Important enhancement |
| 🟢 Low | 3+ months | Nice to have |
| 🔵 Future | 6+ months | Long-term vision |

## Getting Started

### For New Contributors

1. Review [Development Blueprint](Development-Blueprint)
2. Set up development environment ([Getting Started](Getting-Started))
3. Pick a task from this list
4. Create an issue (if not exists)
5. Implement following best practices
6. Submit PR for review

### For Maintainers

1. Prioritize tasks based on user feedback
2. Review and approve PRs
3. Update this document as tasks complete
4. Plan releases and roadmap
5. Communicate with community

---

**Related Pages:**
- [Development Blueprint](Development-Blueprint) - Project vision
- [Implementation Overview](Implementation-Overview) - Recent changes
- [Application Architecture](Application-Architecture) - Technical structure

---

**💡 Contribution Tip:** Start with High Priority tasks for maximum impact, or pick a Low Priority task to learn the codebase!
