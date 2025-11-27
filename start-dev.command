#!/bin/bash
# Double-click this file to start the Scribbler dev server on macOS / Linux
cd "$(dirname "$0")"
echo "Starting TheScribbler dev server..."
export PATH="/usr/local/bin:$PATH"
npm run dev
