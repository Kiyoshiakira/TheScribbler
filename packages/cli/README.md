# TheScribbler CLI

Command-line interface for TheScribbler - create, edit, and sync documents locally.

## Quick Start

```bash
# Install globally
npm install -g thescribbler-cli

# Or use with npx
npx thescribbler-cli login
```

## Documentation

For complete documentation, see [docs/CLI.md](../../docs/CLI.md) in the main repository.

## Commands

- `login` - Authenticate with TheScribbler
- `new [title]` - Create a new document
- `list` - List all documents
- `export <documentId>` - Export a document to local file
- `import <file>` - Import a local file to TheScribbler
- `sync [documentId]` - Sync local changes with remote

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js [command]
```
