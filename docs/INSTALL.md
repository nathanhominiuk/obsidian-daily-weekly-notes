# Installation Instructions

## Quick Start Guide

### Step 1: Build the Plugin

```bash
npm install
npm run build
```

This will create the `main.js` file needed to run the plugin.

### Step 2: Install in Obsidian

1. Copy the following files to your Obsidian vault:
   - `main.js`
   - `manifest.json`

2. Place them in: `.obsidian/plugins/daily-weekly-notes/`
   
   For example, if your vault is at `/path/to/my-vault/`, create:
   ```
   /path/to/my-vault/.obsidian/plugins/daily-weekly-notes/
   ```

3. Restart Obsidian

4. Go to Settings → Community Plugins

5. Enable "Daily & Weekly Notes"

### Step 3: Use the Plugin

Open the Command Palette (Ctrl/Cmd + P) and search for:
- "Create daily note" - to create today's daily note
- "Create weekly note" - to create this week's weekly note

## Development Installation

If you want to develop the plugin:

1. Clone/copy the entire plugin folder to your vault's plugins directory:
   ```
   .obsidian/plugins/daily-weekly-notes/
   ```

2. Navigate to the folder and run:
   ```bash
   npm install
   npm run dev
   ```

3. This will watch for changes and automatically rebuild

4. Reload Obsidian (Ctrl/Cmd + R) to see changes

## Troubleshooting

- **Plugin doesn't appear in settings**: Make sure you've placed the files in the correct location and restarted Obsidian
- **Commands don't appear**: Enable the plugin in Settings → Community Plugins
- **Build errors**: Make sure you have Node.js installed (version 22.13 or higher; CI uses 24)
- **Plugin fails to load**: Obsidian 1.13.0 or later is required
