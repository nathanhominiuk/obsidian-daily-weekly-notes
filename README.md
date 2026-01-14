# Daily & Weekly Notes Creator for Obsidian

An Obsidian plugin that creates templated daily and weekly notes the way I want them. 

## Features

### Daily Notes
- Automatically formats the current date as `dddd MMMM Do, YYYY` (e.g., *Tuesday January 6th, 2026*)
- Creates links to:
  - The weekly note for the current ISO week
  - Yesterday's daily note
  - Tomorrow's daily note
- Adds a horizontal rule separator
- Fully customizable date format via settings

### Weekly Notes
- Creates notes titled with ISO week numbers (e.g., "2026 - Week 2")
- Displays the date range for the week
- Creates links to:
  - Last week's note
  - All 7 daily notes for the week (Monday through Sunday)
  - Next week's note
- Handles month boundaries intelligently (e.g., "January 30th - February 5th")
- Correctly handles year boundaries with ISO week years
- Adds a horizontal rule separator
- Fully customizable date format via settings

### Customizable Settings
- Configure custom folder locations for daily and weekly notes
- Configure daily note filename format
- Configure weekly note filename format
- Configure weekly date range display format
- Live preview of format changes
- Uses Moment.js format strings for maximum flexibility

## Installation

### From Obsidian Community Plugins (Recommended)
*Coming soon - plugin is currently in beta*

### Manual Installation

1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder named `daily-weekly-notes` in your vault's `.obsidian/plugins/` directory
3. Copy the release files into this folder
4. Restart Obsidian
5. Go to Settings → Community Plugins and enable "Daily & Weekly Notes Creator"

### Building from Source

If you want to build the plugin yourself or contribute to development:

1. Clone this repository
2. Navigate to the plugin folder
3. Install dependencies: `npm install`
4. Build the plugin: `npm run build`
5. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/daily-weekly-notes/` folder

## Usage

### Creating Daily Notes

1. Open the Command Palette (Ctrl/Cmd + P)
2. Search for "Create Daily Note"
3. Press Enter

The plugin will create a note named with today's date (e.g., `2026-01-06.md`) with the following format:

```markdown
*Tuesday January 6th, 2026*

Week - [[2026 - Week 2]]
Yesterday - [[2026-01-05]]
Tomorrow - [[2026-01-07]]

---

```

### Creating Weekly Notes

1. Open the Command Palette (Ctrl/Cmd + P)
2. Search for "Create Weekly Note"
3. Press Enter

The plugin will create a note named with the ISO week (e.g., `2026 - Week 2.md`) with the following format:

```markdown
January 5th - 11th

Last week - [[2026 - Week 1]]

Monday - [[2026-01-05]]
Tuesday - [[2026-01-06]]
Wednesday - [[2026-01-07]]
Thursday - [[2026-01-08]]
Friday - [[2026-01-09]]
Saturday - [[2026-01-10]]
Sunday - [[2026-01-11]]

Next week - [[2026 - Week 3]]

---

```

## Configuration

Access the plugin settings through Settings → Community Plugins → Daily & Weekly Notes Creator.

### Date Format Options

Configure three different date formats:

1. **Daily note filename format** - Format for daily note filenames and links
   - Default: `YYYY-MM-DD`
   - Example: `2026-01-06`

2. **Weekly note filename format** - Format for weekly note filenames and links
   - Default: `GGGG - [Week] W`
   - Example: `2026 - Week 2`
   - Use `GGGG` for ISO week year (handles year boundaries correctly)
   - Use `W` for ISO week number
   - Use `[text]` for literal text

3. **Weekly note date range format** - Format for the date range shown in weekly notes
   - Default: `MMMM Do`
   - Example: `January 6th`

### Common Format Patterns

- `YYYY-MM-DD` → 2026-01-06 (for daily notes)
- `YYYY/MM/DD` → 2026/01/06 (for daily notes)
- `YYYYMMDD` → 20260106 (for daily notes)
- `GGGG-[W]W` → 2026-W2 (for weekly notes)
- `GGGG - [Week] W` → 2026 - Week 2 (for weekly notes)
- `MMMM Do` → January 6th (for date ranges)
- `MMM D` → Jan 6 (for date ranges)

See the [Moment.js format documentation](https://momentjs.com/docs/#/displaying/format/) for all available format tokens.

## Behavior with Existing Notes

If a daily or weekly note already exists, the plugin will:
- Insert the template content at the top of the existing note
- Add an extra line separator between the template and existing content
- Display a notification confirming the template was added

## Technical Details

- Uses ISO 8601 week numbering system
- Weeks start on Monday
- Handles year boundaries correctly for week numbers using ISO week years
- Mobile compatible
- No data loss risk - only creates and prepends to notes
- Lightweight with minimal dependencies

## Known Limitations

- Date formats must be valid Moment.js format strings
- Templates are fixed (custom template support coming in future version)

## Development

### Repository Structure

```
├── src/                 # Source code
│   ├── main.ts          # Plugin source code
│   ├── esbuild.config.mjs
│   ├── tsconfig.json
│   └── version-bump.mjs
├── docs/                # Documentation
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   └── ...
├── main.js              # Built plugin (output)
├── manifest.json        # Plugin manifest
├── styles.css           # Plugin styles
└── README.md
```

### Building

```bash
npm run build
```

### Development Mode (with auto-rebuild)

```bash
npm run dev
```

## Support

If you encounter any issues or have feature requests, please [open an issue on GitHub](https://github.com/nathanhominiuk/daily-weekly-notes/issues).

## Roadmap

Future features under consideration:
- Customizable templates
- Support for monthly notes
- Quarterly notes
- More date format presets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Created by Nathan Hominiuk

Built with:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api)
- [Moment.js](https://momentjs.com/) for date handling

