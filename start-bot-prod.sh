#!/bin/bash
# Production startup script for PM2
# Runs the compiled JavaScript code from dist/

cd "$(dirname "$0")"

# Check if dist/ exists
if [ ! -d "dist" ]; then
  echo "Error: dist/ directory not found. Run 'npm run build' first."
  exit 1
fi

# Run the compiled start.js
exec node ./dist/start.js
