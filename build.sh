#!/usr/bin/env bash
# build.sh — Used by Render to build the full stack.
# Render's rootDir is set to "backend", so this script is invoked from there.
# We navigate up to build the React frontend first, then return to install Python deps.

set -e  # Exit immediately on any error

echo "=== [1/3] Building React frontend ==="
cd ../frontend
npm install --legacy-peer-deps
npm run build
echo "    React build complete: $(pwd)/build"

echo "=== [2/3] Returning to backend ==="
cd ../backend

echo "=== [3/3] Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Build complete ==="
