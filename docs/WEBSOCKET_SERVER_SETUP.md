# WebSocket Server for Collaborative Editing

This directory contains a simple WebSocket server setup for enabling real-time collaborative editing in TheScribbler.

## Quick Start

### Option 1: Using the Public Demo Server (Development Only)

The application will automatically fall back to `wss://demos.yjs.dev` for testing. This is **NOT** recommended for production as your data may be visible to others on the shared server.

### Option 2: Deploy Your Own Server (Recommended)

#### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

#### Installation

1. Create a new directory for your WebSocket server:

```bash
mkdir collab-server
cd collab-server
npm init -y
```

2. Install dependencies:

```bash
npm install ws y-websocket
```

3. Create `server.js`:

```javascript
#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('WebSocket collaboration server is running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

server.listen(port, host, () => {
  console.log(`WebSocket server running on ws://${host}:${port}`);
});
```

4. Add scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

5. Start the server:

```bash
npm start
```

The server will run on `ws://localhost:1234` by default.

#### Configuration

Set environment variables:
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 1234)

Example:
```bash
HOST=0.0.0.0 PORT=8080 npm start
```

#### Production Deployment

##### Deploy to Heroku

1. Create a `Procfile`:
```
web: node server.js
```

2. Deploy:
```bash
heroku create your-collab-server
git push heroku main
```

3. Configure TheScribbler to use your server:
```typescript
<CollaborativeEditor
  websocketUrl="wss://your-collab-server.herokuapp.com"
  // ... other props
/>
```

##### Deploy to Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Deploy:
```bash
railway login
railway init
railway up
```

3. Get your deployment URL and configure TheScribbler.

##### Deploy to DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build command: `npm install`
3. Configure run command: `npm start`
4. Set environment variables if needed
5. Deploy

##### Deploy to Your Own VPS

1. Copy files to your server
2. Install Node.js and npm
3. Run `npm install`
4. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name collab-server
pm2 save
pm2 startup
```

5. Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name collab.yourdomain.com;

    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. Enable HTTPS with Let's Encrypt:
```bash
sudo certbot --nginx -d collab.yourdomain.com
```

#### Security Considerations

1. **Authentication**: Add JWT authentication to WebSocket connections
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **CORS**: Configure CORS headers appropriately
4. **SSL/TLS**: Always use WSS (WebSocket Secure) in production
5. **Monitoring**: Set up logging and monitoring for the server

#### Advanced Features

You can enhance the server with:

1. **Persistence**: Store document snapshots to database
2. **Authentication**: Integrate with your auth system
3. **Rate limiting**: Prevent abuse
4. **Metrics**: Monitor active connections and rooms
5. **Scaling**: Use Redis for multi-instance deployments

Example with persistence:

```javascript
const { LeveldbPersistence } = require('y-leveldb');

const persistence = new LeveldbPersistence('./db');

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, { persistence });
});
```

## Monitoring

Check active connections:
```bash
# Number of active WebSocket connections
netstat -an | grep :1234 | grep ESTABLISHED | wc -l
```

## Troubleshooting

### Connection refused
- Check if server is running: `ps aux | grep node`
- Verify port is not blocked by firewall
- Check server logs for errors

### High memory usage
- Monitor with `pm2 monit`
- Consider implementing document size limits
- Clean up inactive rooms periodically

### Slow performance
- Check network latency
- Monitor server resources
- Consider load balancing for high traffic

## Support

For issues or questions:
1. Check the main COLLABORATION_README.md
2. Review Yjs documentation: https://docs.yjs.dev
3. Check y-websocket docs: https://github.com/yjs/y-websocket
