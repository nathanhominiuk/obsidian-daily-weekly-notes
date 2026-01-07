#!/bin/bash

# Build script for Obsidian plugin using Podman
# This script will build the plugin and output files to ./outputs/

echo "Building Obsidian plugin with Podman..."

# Create outputs directory if it doesn't exist
mkdir -p ./outputs

# Run the build container
podman run --rm \
  --name obsidian-plugin-builder \
  -v "$(pwd):/app" \
  -v "$(pwd)/outputs:/app/outputs:rw" \
  -w /app \
  --tmpfs /tmp \
  --tmpfs /app/node_modules \
  --security-opt no-new-privileges:true \
  docker.io/library/node:18-alpine \
  sh -c "
    echo 'Installing dependencies...' &&
    npm install &&
    echo 'Building plugin...' &&
    npm run build &&
    echo 'Copying build artifacts to outputs...' &&
    cp main.js /app/outputs/ &&
    cp manifest.json /app/outputs/ &&
    cp styles.css /app/outputs/ &&
    echo '' &&
    echo '✓ Build complete! Files are in the outputs directory:' &&
    ls -lh /app/outputs/
  "

if [ $? -eq 0 ]; then
    echo ""
    echo "Success! Your plugin files are ready in ./outputs/"
    echo "Copy these files to your Obsidian vault's .obsidian/plugins/daily-weekly-notes/ folder"
else
    echo ""
    echo "Build failed. Please check the error messages above."
    exit 1
fi
