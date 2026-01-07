# Building the Plugin with Podman

This guide shows you how to build the Obsidian plugin using Podman without installing Node.js or NPM on your system.

## Prerequisites

- Podman installed on your system
- No other dependencies needed!

## Quick Start

### Option 1: Using the Build Script (Recommended)

#### On Linux/Mac:
```bash
./build-with-podman.sh
```

#### On Windows:
```cmd
build-with-podman.bat
```

The script will:
1. Create an `outputs` directory if it doesn't exist
2. Run a Node.js container to build the plugin
3. Copy the built files (`main.js`, `manifest.json`, `styles.css`) to the `outputs` directory

### Option 2: Using Podman Compose

```bash
podman-compose up
```

Or with docker-compose:
```bash
docker-compose -f podman-compose.yml up
```

### Option 3: Manual Podman Command

```bash
mkdir -p ./outputs

podman run --rm \
  --name obsidian-plugin-builder \
  -v "$(pwd):/app:ro" \
  -v "$(pwd)/outputs:/app/outputs:rw" \
  -w /app \
  --tmpfs /tmp \
  --tmpfs /app/node_modules \
  --security-opt no-new-privileges:true \
  docker.io/library/node:18-alpine \
  sh -c "npm install && npm run build && cp main.js manifest.json styles.css /app/outputs/"
```

## Security Features

The container is configured with security in mind:
- ✅ Source files mounted read-only
- ✅ Only the outputs directory has write access
- ✅ No access to parent directories
- ✅ `no-new-privileges` security option enabled
- ✅ Temporary filesystems for `/tmp` and `node_modules`
- ✅ Container runs without persistent state

## After Building

Once the build completes successfully:

1. You'll find three files in the `outputs` directory:
   - `main.js` - The compiled plugin
   - `manifest.json` - Plugin metadata
   - `styles.css` - Plugin styles

2. Copy these files to your Obsidian vault:
   ```
   <your-vault>/.obsidian/plugins/daily-weekly-notes/
   ```

3. Restart Obsidian

4. Enable the plugin in Settings → Community Plugins

## Troubleshooting

### "Permission denied" errors
- On Linux/Mac: Make sure the build script is executable: `chmod +x build-with-podman.sh`
- Check that Podman has permission to access your current directory

### "Image not found" errors
- The container will automatically pull the Node.js image on first run
- If you have network issues, you can manually pull it first:
  ```bash
  podman pull docker.io/library/node:18-alpine
  ```

### Build fails
- Check the error messages in the output
- Ensure all plugin files (main.ts, package.json, etc.) are present
- Try removing the `outputs` directory and running again

### Files not appearing in outputs
- Check that the outputs directory was created
- Verify you have write permissions in the current directory
- Check Podman logs: `podman logs obsidian-plugin-builder`

## Clean Build

To start fresh, remove the outputs directory:
```bash
rm -rf ./outputs
```

Then run the build script again.
