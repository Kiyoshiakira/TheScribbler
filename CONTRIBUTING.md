# Contributing to The Scribbler

Thank you for your interest in contributing to The Scribbler! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)
- Git
- A Firebase project (for full functionality)
- Google Gemini API key (for AI features)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/TheScribbler.git
   cd TheScribbler
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/Kiyoshiakira/TheScribbler.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   - Copy `.env` to `.env.local`
   - Fill in your Firebase and API credentials
   - See [docs/USER_SETUP_INSTRUCTIONS.md](docs/USER_SETUP_INSTRUCTIONS.md) for detailed setup

6. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:9002](http://localhost:9002)

## Development Workflow

### Branch Strategy

- **main** - Production-ready code
- **develop** - Integration branch for features
- **feature/\*** - New features
- **fix/\*** - Bug fixes
- **docs/\*** - Documentation updates

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and checkout a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the feature branch
2. Follow our [coding standards](#coding-standards)
3. Write or update tests as needed
4. Run linters and tests locally
5. Commit your changes with clear, descriptive messages

### Commit Message Guidelines

We follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(editor): add keyboard shortcut for scene navigation
fix(export): correct PDF formatting for dialogue blocks
docs(contributing): add commit message guidelines
test(save-manager): add unit tests for offline sync
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for object shapes

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use ESLint and Prettier for formatting

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use proper prop types

### Accessibility

- Ensure all UI elements are keyboard accessible
- Use semantic HTML elements
- Include ARIA labels where appropriate
- Test with screen readers when possible

## Testing

### Running Tests

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Check code coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions and business logic
- Write integration tests for complex components
- Write E2E tests for critical user flows
- Aim for meaningful test coverage, not just high percentages

### Test Structure

```typescript
describe('Component/Module Name', () => {
  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

## Submitting Changes

### Before Submitting

1. **Update your branch** with the latest changes:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run test:e2e
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin your-feature-branch
   ```

2. **Open a Pull Request** on GitHub:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template

3. **PR Title and Description**:
   - Use a clear, descriptive title
   - Explain what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

4. **Address Review Feedback**:
   - Respond to comments
   - Make requested changes
   - Push updates to your branch
   - Request re-review when ready

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with main
- [ ] Screenshots included for UI changes

## Issue Guidelines

### Reporting Bugs

When reporting bugs, please include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, browser, Node version)
- **Screenshots or error messages**

### Suggesting Features

When suggesting features, please include:

- **Clear use case**
- **Problem it solves**
- **Proposed solution**
- **Alternative approaches considered**
- **Mockups or examples** if applicable

### Good First Issues

Look for issues labeled `good first issue` if you're new to the project. These are simpler tasks that are good for getting started.

## Development Resources

- [Architecture Documentation](docs/ARCHITECTURE.md) - System design and structure
- [Development Guide](docs/DEVELOPMENT.md) - Detailed development setup
- [User Setup Instructions](docs/USER_SETUP_INSTRUCTIONS.md) - Firebase setup guide
- [Troubleshooting Guide](docs/TROUBLESHOOTING_403_ERRORS.md) - Common issues

## Questions?

- Check existing [documentation](docs/)
- Search existing [issues](https://github.com/Kiyoshiakira/TheScribbler/issues)
- Open a new issue for questions
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to The Scribbler! 🎬📝
