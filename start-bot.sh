#!/bin/bash
# PM2 startup wrapper script
# Executes tsx from node_modules to run the TypeScript bot

cd "$(dirname "$0")"
exec ./node_modules/.bin/tsx ./src/start.ts
