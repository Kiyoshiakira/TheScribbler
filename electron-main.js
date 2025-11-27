// Minimal Electron main for dev: spawn the dev server and open a window to localhost:9002
// Place at repository root (e.g., TheScribbler/electron-main.js)

const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;
let mainWindow = null;
const DEV_URL = process.env.DEV_URL || 'http://localhost:9002';
const START_TIMEOUT_MS = 20000; // fallback timeout to open window if "ready" isn't detected

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(url).catch(err => {
    console.error('Failed to load URL:', err);
    dialog.showErrorBox('Failed to load', String(err));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startDevServerAndOpen() {
  // Start the existing dev script (assumes `npm run dev` exists and serves on localhost:9002)
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve(__dirname),
    shell: true,
    env: Object.assign({}, process.env, { FORCE_COLOR: 'true' }),
  });

  let opened = false;

  const fallbackOpen = setTimeout(() => {
    if (!opened) {
      console.warn('Dev server did not print a ready banner; opening window anyway (fallback).');
      opened = true;
      createWindow(DEV_URL);
    }
  }, START_TIMEOUT_MS);

  serverProcess.stdout.on('data', chunk => {
    const s = chunk.toString();
    console.log('[dev-server]', s);
    // heuristics: Next.js dev prints "started" / "ready" / "compiled"
    if (!opened && (s.match(/(ready|started|compiled|compiled successfully)/i) || s.includes('Local:'))) {
      opened = true;
      clearTimeout(fallbackOpen);
      createWindow(DEV_URL);
    }
  });

  serverProcess.stderr.on('data', chunk => {
    console.error('[dev-server][stderr]', chunk.toString());
  });

  serverProcess.on('exit', code => {
    console.log('Dev server exited with code', code);
    serverProcess = null;
    // close the renderer if it's open
    if (mainWindow) {
      try { mainWindow.close(); } catch (e) {}
    }
  });

  serverProcess.on('error', err => {
    console.error('Dev server failed to start:', err);
  });
}

app.whenReady().then(() => {
  startDevServerAndOpen();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow(DEV_URL);
    }
  });
});

app.on('window-all-closed', () => {
  // kill the dev server when all windows are closed
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) { /* ignore */ }
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch (e) {}
  }
});
