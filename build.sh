#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting build process for Postgres Manager..."

# 1. Clean previous builds
echo "🧹 Cleaning release folder..."
rm -rf release/

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the app
echo "🏗️ Building application..."
npm run build

echo "✅ Build complete! Check the 'release' folder for your installer."
