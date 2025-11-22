# TheScribbler CLI

A command-line interface for TheScribbler that allows power users to create, edit, and sync documents locally.

## Installation

```bash
# Install globally via npm
npm install -g thescribbler-cli

# Or use with npx (no installation required)
npx thescribbler-cli [command]
```

## Authentication

Before using the CLI, you need to authenticate with your TheScribbler account.

### Getting Your Firebase ID Token

1. Log in to TheScribbler web application
2. Open your browser's developer console (F12 or Cmd+Option+I)
3. Run the following command in the console:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))
   ```
4. Copy the token that appears in the console

### Login to CLI

```bash
thescribbler login
```

You will be prompted for:
- **API URL**: The TheScribbler server URL (default: `http://localhost:9002`)
- **Firebase Auth Token**: Paste the ID token you copied from the browser

The CLI will verify your token and store it locally for future use.

## Commands

### `login`

Authenticate with TheScribbler and save your credentials.

```bash
thescribbler login
```

### `new [title]`

Create a new document.

```bash
# Interactive mode (will prompt for details)
thescribbler new

# With title
thescribbler new "My Screenplay"

# With options
thescribbler new "My Screenplay" --logline "A story about..." --content "INT. SCENE..."
```

**Options:**
- `-l, --logline <logline>` - Add a logline to the document
- `-c, --content <content>` - Initial content for the document

### `list`

List all your documents.

```bash
# Table format (default)
thescribbler list

# JSON format
thescribbler list --format json
```

**Options:**
- `-f, --format <format>` - Output format: `table` or `json` (default: `table`)

### `export <documentId>`

Export a document to a local file.

```bash
# Export to default filename
thescribbler export abc123

# Export to specific file
thescribbler export abc123 --output my-script.md

# Export as Fountain format
thescribbler export abc123 --format fountain --output my-script.fountain
```

**Options:**
- `-o, --output <path>` - Output file path
- `-f, --format <format>` - Export format: `md`, `txt`, or `fountain` (default: `md`)

### `import <file>`

Import a local file to TheScribbler.

```bash
# Import with auto-generated title
thescribbler import my-script.md

# Import with custom title
thescribbler import my-script.md --title "My Screenplay"

# Import with title and logline
thescribbler import my-script.md --title "My Screenplay" --logline "A story about..."
```

**Options:**
- `-t, --title <title>` - Document title (defaults to filename)
- `-l, --logline <logline>` - Document logline

### `sync [documentId]`

Sync documents with TheScribbler server.

```bash
# Sync all documents
thescribbler sync

# Sync specific document
thescribbler sync abc123

# Sync with direction
thescribbler sync abc123 --direction pull
```

**Options:**
- `-d, --direction <direction>` - Sync direction: `push`, `pull`, or `both` (default: `both`)

**Note:** Full bidirectional sync with local cache is not yet implemented. Use `export` to download and `import` to upload documents for now.

## Configuration

The CLI stores configuration in your home directory:
- **Location**: `~/.config/thescribbler-cli/`
- **Contents**: API URL, authentication token, and user ID

To reset your configuration:
```bash
rm -rf ~/.config/thescribbler-cli/
```

## VSCode Integration (Optional)

The CLI provides an integration point for VSCode extensions to push local Markdown files to TheScribbler.

### Creating a VSCode Extension

To create a VSCode extension that integrates with TheScribbler:

1. Create a new VSCode extension project
2. Add a command to push the current Markdown file:

```javascript
const vscode = require('vscode');
const { exec } = require('child_process');

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    'thescribbler.pushToScribbler',
    async function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const document = editor.document;
      const filePath = document.fileName;

      // Save the file first
      await document.save();

      // Import to TheScribbler
      exec(`npx thescribbler-cli import "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
          vscode.window.showErrorMessage(`Failed to push to TheScribbler: ${error.message}`);
          return;
        }
        vscode.window.showInformationMessage('Pushed to TheScribbler successfully!');
      });
    }
  );

  context.subscriptions.push(disposable);
}

exports.activate = activate;
```

3. Add a keybinding in `package.json`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "thescribbler.pushToScribbler",
        "title": "Push to TheScribbler"
      }
    ],
    "keybindings": [
      {
        "command": "thescribbler.pushToScribbler",
        "key": "ctrl+shift+s",
        "mac": "cmd+shift+s",
        "when": "editorLangId == markdown"
      }
    ]
  }
}
```

## Security Notes

- **Token Storage**: Your authentication token is stored locally in plain text. Keep your system secure.
- **Token Expiration**: Firebase ID tokens expire after 1 hour. If you encounter authentication errors, run `thescribbler login` again to get a new token.
- **HTTPS**: In production, always use HTTPS for the API URL to protect your token in transit.

## Troubleshooting

### Authentication Errors

If you see "Not authenticated" errors:
1. Run `thescribbler login` again
2. Make sure you copied the full ID token from the browser console
3. Verify the API URL is correct

### Connection Errors

If you can't connect to TheScribbler:
1. Verify the server is running
2. Check the API URL in your config
3. Ensure you have network connectivity

### Firebase Errors

If you encounter Firebase-related errors:
1. Make sure your Firebase project is properly configured
2. Check Firestore security rules allow authenticated access
3. Verify your user account has proper permissions

## Development

To work on the CLI locally:

```bash
# Clone the repository
cd packages/cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link for local testing
npm link

# Use the locally linked CLI
thescribbler [command]
```

## License

MIT
