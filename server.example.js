#!/usr/bin/env node

/**
 * Simple WebSocket Server for TheScribbler Collaborative Editing
 * 
 * This is a minimal y-websocket server that can be deployed independently.
 * 
 * Usage:
 *   node server.example.js
 * 
 * Environment variables:
 *   HOST - Server host (default: 0.0.0.0)
 *   PORT - Server port (default: 1234)
 * 
 * To deploy this server:
 * 1. Copy this file to a new directory
 * 2. Run: npm init -y
 * 3. Run: npm install ws y-websocket
 * 4. Run: node server.example.js
 */

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 1234;

// Create HTTP server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('TheScribbler WebSocket Collaboration Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track active connections and rooms
const stats = {
  connections: 0,
  rooms: new Set(),
};

wss.on('connection', (ws, req) => {
  stats.connections++;
  console.log(`New connection (total: ${stats.connections})`);

  // Setup Yjs WebSocket connection
  setupWSConnection(ws, req);

  // Extract room name from URL for logging
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomName = url.pathname.slice(1) || 'default';
  stats.rooms.add(roomName);

  ws.on('close', () => {
    stats.connections--;
    console.log(`Connection closed (remaining: ${stats.connections})`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(port, host, () => {
  console.log('='.repeat(60));
  console.log('TheScribbler Collaboration Server');
  console.log('='.repeat(60));
  console.log(`Server running on ws://${host}:${port}`);
  console.log(`HTTP endpoint: http://${host}:${port}`);
  console.log('\nPress Ctrl+C to stop');
  console.log('='.repeat(60));
});

// Log stats every 5 minutes
setInterval(() => {
  console.log(`Stats - Connections: ${stats.connections}, Rooms: ${stats.rooms.size}`);
}, 5 * 60 * 1000);
