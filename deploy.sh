#!/bin/bash

# 🚀 Quick Deployment Script for Digital Ocean
# Usage: ./deploy.sh [user@host]

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER=${1:-"root@your_droplet_ip"}
REMOTE_DIR="/var/www/duoq-tracker"
LOCAL_DIR=$(pwd)

echo -e "${GREEN}🚀 DuoQ Tracker Deployment Script${NC}"
echo "====================================="
echo ""
echo "Remote: $REMOTE_USER"
echo "Directory: $REMOTE_DIR"
echo ""

# Step 1: Build locally
echo -e "${YELLOW}📦 Building TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 2: Upload files
echo -e "${YELLOW}📤 Uploading files to server...${NC}"

# Create remote directory if not exists
ssh $REMOTE_USER "mkdir -p $REMOTE_DIR/dist $REMOTE_DIR/logs $REMOTE_DIR/database"

# Upload essential files
scp -r dist/ $REMOTE_USER:$REMOTE_DIR/
scp package.json package-lock.json ecosystem.config.js $REMOTE_USER:$REMOTE_DIR/

echo -e "${GREEN}✅ Files uploaded${NC}"
echo ""

# Step 3: Install dependencies on server
echo -e "${YELLOW}📦 Installing dependencies on server...${NC}"
ssh $REMOTE_USER "cd $REMOTE_DIR && npm install --production"

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Restart PM2
echo -e "${YELLOW}🔄 Restarting PM2...${NC}"
ssh $REMOTE_USER "cd $REMOTE_DIR && pm2 restart duoq-tracker || pm2 start ecosystem.config.js --env production"

echo -e "${GREEN}✅ PM2 restarted${NC}"
echo ""

# Step 5: Save PM2 config
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
ssh $REMOTE_USER "pm2 save"

echo -e "${GREEN}✅ PM2 configuration saved${NC}"
echo ""

# Step 6: Check status
echo -e "${YELLOW}📊 Checking PM2 status...${NC}"
ssh $REMOTE_USER "pm2 status"

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "View logs with: ssh $REMOTE_USER 'pm2 logs duoq-tracker'"
echo "Check status with: ssh $REMOTE_USER 'pm2 status'"
echo ""
