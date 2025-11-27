// Minimal Electron main for dev: spawn the dev server and open a window to localhost:9002
// Place at repository root (e.g., TheScribbler/electron-main.js)

const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let serverProcess = null;
let mainWindow = null;

// Validate and sanitize DEV_URL to only allow localhost URLs
function getDevUrl() {
  const envUrl = process.env.DEV_URL || 'http://localhost:9002';
  try {
    const url = new URL(envUrl);
    // Only allow localhost URLs for security
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return envUrl;
    }
    console.warn('DEV_URL must be localhost or 127.0.0.1, using default');
    return 'http://localhost:9002';
  } catch {
    console.warn('Invalid DEV_URL, using default');
    return 'http://localhost:9002';
  }
}

const DEV_URL = getDevUrl();
const START_TIMEOUT_MS = 30000; // fallback timeout to open window
const POLL_INTERVAL_MS = 500; // how often to check if server is ready

// Check if the dev server is responding to HTTP requests
function checkServerReady(url, callback) {
  const parsedUrl = new URL(url);
  const defaultPort = parsedUrl.protocol === 'https:' ? 443 : 80;
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || defaultPort,
    path: '/',
    method: 'HEAD',
    timeout: 2000,
  };

  const req = http.request(options, res => {
    callback(res.statusCode < 500);
  });

  req.on('error', () => callback(false));
  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });
  req.end();
}

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
  let pollTimer = null;
  const startTime = Date.now();

  // Poll the server with HTTP requests to detect when it's ready
  function pollServer() {
    if (opened) return;
    
    if (Date.now() - startTime > START_TIMEOUT_MS) {
      console.warn('Dev server did not become ready in time; opening window anyway (fallback).');
      opened = true;
      createWindow(DEV_URL);
      return;
    }

    checkServerReady(DEV_URL, isReady => {
      if (opened) return;
      if (isReady) {
        console.log('Dev server is ready, opening window.');
        opened = true;
        createWindow(DEV_URL);
      } else {
        pollTimer = setTimeout(pollServer, POLL_INTERVAL_MS);
      }
    });
  }

  // Start polling after a brief delay to give the server time to start
  pollTimer = setTimeout(pollServer, 1000);

  serverProcess.stdout.on('data', chunk => {
    const s = chunk.toString();
    console.log('[dev-server]', s);
  });

  serverProcess.stderr.on('data', chunk => {
    console.error('[dev-server][stderr]', chunk.toString());
  });

  serverProcess.on('exit', code => {
    console.log('Dev server exited with code', code);
    serverProcess = null;
    if (pollTimer) clearTimeout(pollTimer);
    // close the renderer if it's open
    if (mainWindow) {
      try { mainWindow.close(); } catch (e) {}
    }
  });

  serverProcess.on('error', err => {
    console.error('Dev server failed to start:', err);
    if (pollTimer) clearTimeout(pollTimer);
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
