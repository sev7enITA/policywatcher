#!/bin/bash
# ============================================================================
# POLICY WATCHER - HOSTINGER STANDALONE PACKAGING SCRIPT
# Creates a ready-to-upload ZIP for Next.js standalone server deployment
# ============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[1/4] Preparing Next.js standalone directories...${NC}"
# Copy public static files inside standalone
cp -r public .next/standalone/

# Copy compiled static assets inside standalone/.next
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

# Copy Prisma schema and package config for database migration tools
cp -r prisma .next/standalone/
cp package.json .next/standalone/

echo -e "${BLUE}[2/4] Zipping standalone server build...${NC}"
# Zip contents of standalone directory directly to root of the archive
cd .next/standalone
zip -q -r ../../release-v3.0.1.zip .

echo -e "${BLUE}[3/4] Cleaning temporary standalone files...${NC}"
# Clean up files copied to standalone folder to keep build directory clean
rm -rf public
rm -rf .next/static
rm -rf prisma
rm -rf package.json
cd ../../

echo -e "${GREEN}[4/4] Success! Standalone package created: release-v3.0.1.zip${NC}"
ls -lh release-v3.0.1.zip
