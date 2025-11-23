# Development Guide

This guide provides detailed instructions for setting up and developing The Scribbler.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or later
- **npm** (comes with Node.js)
- **Git** for version control
- A code editor (VS Code recommended)

### Required Accounts

- **Firebase Account** - For authentication and database
- **Google Cloud Account** - For AI features (Gemini API)
- **GitHub Account** - For contributing

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Kiyoshiakira/TheScribbler.git
cd TheScribbler
```

### 2. Install Dependencies

```bash
npm install
```

This will install all project dependencies including:
- Next.js 15 (React framework)
- Firebase SDK
- TypeScript
- Testing libraries (Jest, Playwright)
- UI components (Radix UI)
- And many more...

### 3. Firebase Setup

**Important:** You must complete Firebase setup before the app will work.

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable the following services:
   - **Authentication** (Email/Password and Google)
   - **Firestore Database**
   - **Firebase Hosting** (optional, for deployment)

4. Get your Firebase configuration:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web apps
   - Copy the configuration object

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini AI (required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Picker API (optional, for Google Docs import)
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_cloud_api_key
NEXT_PUBLIC_GOOGLE_APP_ID=your_google_cloud_app_id
```

**Note:** The `.env.local` file is gitignored and will not be committed.

### 5. Firebase Authentication Setup

See [docs/USER_SETUP_INSTRUCTIONS.md](USER_SETUP_INSTRUCTIONS.md) for detailed Firebase Console setup steps.

Quick checklist:
- [ ] Enable Email/Password authentication
- [ ] Enable Google authentication
- [ ] Add `localhost` to authorized domains
- [ ] Deploy Firestore security rules

### 6. Deploy Firestore Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

## Development Environment

### Running the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

**Why port 9002?**
- To avoid conflicts with other common development servers
- Configured in `package.json` scripts

### Development Features

- **Hot Reload** - Changes are reflected immediately
- **Turbopack** - Fast bundling and compilation
- **TypeScript** - Type checking on save
- **ESLint** - Code quality checks

### Useful Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Build for production
npm run build

# Start production server
npm start

# Generate test coverage
npm run test:coverage
```

## Project Structure

```
TheScribbler/
├── .github/              # GitHub configuration
│   └── workflows/        # CI/CD workflows
├── docs/                 # Documentation
├── e2e/                  # End-to-end tests
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── login/        # Login page
│   │   ├── user/         # Public user pages
│   │   └── page.tsx      # Main app
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── views/        # View components
│   ├── context/          # React context providers
│   ├── firebase/         # Firebase configuration
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
│       ├── exporters/    # Export functionality
│       └── __tests__/    # Unit tests
├── .env.local            # Environment variables (not committed)
├── .gitignore            # Git ignore rules
├── jest.config.js        # Jest configuration
├── playwright.config.ts  # Playwright configuration
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Key Directories

- **`src/app/`** - Next.js 15 App Router pages and routes
- **`src/components/`** - All React components
- **`src/firebase/`** - Firebase initialization and utilities
- **`src/utils/`** - Helper functions and utilities
- **`src/services/`** - Business logic and API integrations
- **`e2e/`** - Playwright end-to-end tests

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following the project conventions
- Add or update tests as needed
- Update documentation if necessary

### 3. Test Your Changes

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Run E2E tests (requires dev server running)
npm run test:e2e
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or updates
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `chore:` - Maintenance tasks

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Testing

### Unit Tests (Jest)

Unit tests are located in `__tests__` directories next to the code they test.

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Writing Tests:**

```typescript
// Example: src/utils/__tests__/myFunction.test.ts
import { myFunction } from '../myFunction'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
```

### E2E Tests (Playwright)

E2E tests are located in the `e2e/` directory.

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui
```

**Writing E2E Tests:**

```typescript
// Example: e2e/feature.spec.ts
import { test, expect } from '@playwright/test'

test('should perform user action', async ({ page }) => {
  await page.goto('/')
  await page.click('button')
  await expect(page.locator('h1')).toHaveText('Expected Text')
})
```

### Test Coverage

We aim for:
- **50%+** overall coverage
- **Critical paths** well-tested
- **Business logic** thoroughly tested

View coverage reports:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Building

### Development Build

```bash
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Test the production build locally
npm start
```

The build output goes to `.next/` directory.

### Build Optimization

Next.js automatically:
- Minifies JavaScript and CSS
- Optimizes images
- Generates static pages where possible
- Code splits for optimal loading

## Deployment

### Firebase Hosting

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

3. **Deploy specific services:**
   ```bash
   # Deploy hosting only
   firebase deploy --only hosting
   
   # Deploy Firestore rules only
   firebase deploy --only firestore:rules
   ```

### Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables in Production

Set the same environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Firebase: Firebase Console → App Settings

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find and kill process on port 9002
lsof -ti:9002 | xargs kill -9
```

#### Firebase Authentication Errors

1. Check `.env.local` has correct Firebase config
2. Verify authentication providers are enabled in Firebase Console
3. Add your domain to authorized domains
4. See [docs/TROUBLESHOOTING_403_ERRORS.md](TROUBLESHOOTING_403_ERRORS.md)

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors

```bash
# Check for type errors
npm run typecheck

# Clean build
rm -rf .next
npm run build
```

### Getting Help

- Check [docs/](.) for detailed documentation
- Search [existing issues](https://github.com/Kiyoshiakira/TheScribbler/issues)
- Create a new issue with:
  - Clear description
  - Steps to reproduce
  - Environment details (OS, Node version, browser)
  - Screenshots if applicable

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

**Happy coding! 🎬📝**
