# Development Notes: Custom Folder Locations Feature

## Overview
This document captures the development process for implementing custom folder locations for daily and weekly notes in the Obsidian Daily & Weekly Notes Creator plugin.

**Branch:** `claude/custom-note-folders-SGISY`
**Date:** 2026-01-14
**Feature:** Custom folder locations for daily and weekly notes

---

## Initial Analysis

### Codebase Structure
- **Single main file:** `main.ts` (~319 lines)
- **Current version:** 0.2.4
- **Build tools:** esbuild, TypeScript 5.8.3
- **Dependencies:** Obsidian API, uses global moment.js from Obsidian

### Current Settings Interface
```typescript
interface DailyWeeklyNotesSettings {
    dailyNoteFormat: string;      // Default: 'YYYY-MM-DD'
    weeklyNoteFormat: string;     // Default: 'GGGG - [Week] W'
    weeklyDateRangeFormat: string; // Default: 'MMMM Do'
}
```

### Current Behavior
- Notes are created in the vault root (no folder specification)
- File paths are constructed as `${fileName}.md`
- Links in generated content do not include folder paths

### Roadmap Confirmation
The README.md explicitly lists "Custom folder locations for daily and weekly notes" under the Roadmap section, confirming this is a planned feature.

---

## Implementation Plan

### 1. Settings Changes
Add two new settings:
- `dailyNotesFolder`: string (default: '' for vault root)
- `weeklyNotesFolder`: string (default: '' for vault root)

### 2. Code Changes Required

#### a. Update Interface (`DailyWeeklyNotesSettings`)
Add folder path fields to the settings interface.

#### b. Update Default Settings
Add default values (empty string = vault root).

#### c. Update `loadSettings()`
Add validation/sanitization for folder paths.

#### d. Update `createDailyNote()`
- Construct file path with folder prefix
- Ensure folder exists before creating note

#### e. Update `createWeeklyNote()`
- Construct file path with folder prefix
- Ensure folder exists before creating note

#### f. Update `generateDailyNoteContent()`
- Include folder paths in wiki links to:
  - Weekly note (`[[folder/weekLink]]`)
  - Yesterday's note
  - Tomorrow's note

#### g. Update `generateWeeklyNoteContent()`
- Include folder paths in wiki links to:
  - Last week's note
  - Daily notes (Monday-Sunday)
  - Next week's note

#### h. Add folder creation helper
- Check if folder exists
- Create folder recursively if needed

#### i. Update Settings Tab UI
- Add text inputs for folder paths
- Add preview of full file paths
- Add help text explaining behavior

### 3. Version Bump
Per CONTRIBUTING.md, version bumping is automated via GitHub Actions. I should NOT manually bump versions. The PR should be labeled with `minor` since this is a new backwards-compatible feature.

---

## Tool Usage Log

### Files Read
1. `main.ts` - Main plugin source code (319 lines)
2. `README.md` - Plugin documentation, confirmed roadmap includes this feature
3. `CHANGELOG.md` - Version history, current version 0.2.4
4. `manifest.json` - Plugin metadata, version 0.2.4
5. `CONTRIBUTING.md` - Contribution guidelines, version automation info
6. `versions.json` - Obsidian version compatibility mapping
7. `package.json` - Build configuration

### Key Observations from Code Review

#### File Path Construction (current)
```typescript
// Daily note (line 71)
const filePath = normalizePath(`${fileName}.md`);

// Weekly note (line 88)
const filePath = normalizePath(`${fileName}.md`);
```

#### Link Generation (current)
Links are generated without folder paths:
```typescript
// Daily note content (lines 108-112)
Week - [[${weekLink}]]
Yesterday - [[${yesterday}]]
Tomorrow - [[${tomorrow}]]

// Weekly note content (lines 144-147, 151-154)
${dayName} - [[${dayDate.format(this.settings.dailyNoteFormat)}]]
Last week - [[${lastWeek}]]
Next week - [[${nextWeek}]]
```

---

## Design Decisions

### 1. Empty String = Vault Root
Using empty string as default for folder paths means:
- No breaking change for existing users
- Simple conditional logic: `folder ? folder + '/' + name : name`

### 2. Path Normalization
Use Obsidian's `normalizePath()` for all path construction to handle:
- Trailing/leading slashes
- Platform-specific separators
- Special characters

### 3. Folder Creation
Create folders automatically if they don't exist:
- Better UX - users don't need to manually create folders
- Use Obsidian's `vault.createFolder()` method
- Handle nested folders (e.g., "Daily Notes/2026")

### 4. Wiki Link Format
For cross-folder links, use full paths:
- `[[Daily Notes/2026-01-14]]` instead of `[[2026-01-14]]`
- This ensures links work correctly regardless of current folder context

### 5. Settings UI
Place folder settings at the top of settings panel since they're fundamental configuration:
- Clear labels: "Daily notes folder" and "Weekly notes folder"
- Help text explaining empty = vault root
- Path preview showing example file location

---

## Implementation Details

### Modified Settings Interface
```typescript
interface DailyWeeklyNotesSettings {
    dailyNotesFolder: string;      // NEW
    weeklyNotesFolder: string;     // NEW
    dailyNoteFormat: string;
    weeklyNoteFormat: string;
    weeklyDateRangeFormat: string;
}
```

### File Path Construction (new)
```typescript
// Helper function for building paths
private buildFilePath(folder: string, fileName: string): string {
    const fullPath = folder ? `${folder}/${fileName}.md` : `${fileName}.md`;
    return normalizePath(fullPath);
}
```

### Folder Existence Check
```typescript
private async ensureFolderExists(folderPath: string): Promise<void> {
    if (!folderPath) return; // Vault root always exists

    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        await this.app.vault.createFolder(folderPath);
    }
}
```

### Link Path Construction
```typescript
// Helper for wiki link paths (without .md extension)
private buildLinkPath(folder: string, fileName: string): string {
    return folder ? `${folder}/${fileName}` : fileName;
}
```

---

## Testing Considerations

1. **Empty folders** - Notes created in vault root
2. **Simple folder** - `Daily Notes` creates `Daily Notes/2026-01-14.md`
3. **Nested folder** - `Notes/Daily` creates `Notes/Daily/2026-01-14.md`
4. **Folder with spaces** - Should work via normalizePath
5. **Existing folders** - Should not error
6. **Non-existing folders** - Should be created automatically
7. **Cross-linking** - Daily notes should link to weekly folder and vice versa

---

## Files Modified

1. `main.ts` - Core implementation
2. `CHANGELOG.md` - Document new feature
3. `DEV_NOTES_CUSTOM_FOLDERS.md` - This file (development documentation)

---

## Post-Implementation Notes

### Build Results
- Build completed successfully with no TypeScript errors
- No new warnings introduced

### Files Modified
1. **main.ts** - Core implementation changes:
   - Added `dailyNotesFolder` and `weeklyNotesFolder` to settings interface
   - Added default values (empty strings) for folder settings
   - Added folder path sanitization in `loadSettings()`
   - Added helper methods: `buildFilePath()`, `buildLinkPath()`, `ensureFolderExists()`
   - Updated `createDailyNote()` to create folders and use folder paths
   - Updated `createWeeklyNote()` to create folders and use folder paths
   - Updated `generateDailyNoteContent()` to include folder paths in wiki links
   - Updated `generateWeeklyNoteContent()` to include folder paths in wiki links
   - Added folder settings UI in settings tab with live path previews

2. **CHANGELOG.md** - Added new feature documentation

3. **DEV_NOTES_CUSTOM_FOLDERS.md** - This development notes file

### Key Implementation Details

#### Settings Interface (final)
```typescript
interface DailyWeeklyNotesSettings {
    dailyNotesFolder: string;      // NEW: Default ''
    weeklyNotesFolder: string;     // NEW: Default ''
    dailyNoteFormat: string;
    weeklyNoteFormat: string;
    weeklyDateRangeFormat: string;
}
```

#### Helper Methods Added
```typescript
// Build file path with folder and extension
private buildFilePath(folder: string, fileName: string): string

// Build link path for wiki links (no extension)
private buildLinkPath(folder: string, fileName: string): string

// Create folder if it doesn't exist
private async ensureFolderExists(folderPath: string): Promise<void>
```

#### Backward Compatibility
- Empty folder string = vault root (original behavior)
- No migration needed - existing settings continue to work
- New settings default to empty strings

### Versioning Note
Per CONTRIBUTING.md, version numbers are NOT manually updated. GitHub Actions will automatically bump the version when this PR is merged with the `minor` label (since this is a new feature).

---

## Commit History

### Initial Commit
- Implemented custom folder locations feature
- Added settings UI for folder configuration
- Updated CHANGELOG.md
- Created DEV_NOTES_CUSTOM_FOLDERS.md
