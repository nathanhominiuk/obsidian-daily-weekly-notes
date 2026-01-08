# Obsidian Plugin Guidelines Review Notes

**Review Date:** 2026-01-07
**Plugin:** Daily & Weekly Notes Creator (v0.2.0 → v0.2.1)
**Reviewer:** Claude (Opus 4.5)
**Branch:** `claude/review-obsidian-guidelines-pM6v2`

---

## Overview

This document details the review process of the Daily & Weekly Notes plugin against Obsidian's official plugin guidelines. The review covers all sections of the guidelines including General, Mobile, UI Text, Security, Resource Management, Commands, Workspace, Vault, Editor, Styling, and TypeScript best practices.

---

## Review Process

### Files Examined

| File | Purpose | Lines |
|------|---------|-------|
| `main.ts` | Main plugin source code | 321 |
| `manifest.json` | Plugin metadata | 10 |
| `package.json` | NPM package configuration | 24 |
| `versions.json` | Version compatibility mapping | 3 |
| `styles.css` | Plugin CSS styles | 4 |

### Tools Used

1. **File Read Tool** - Read all source files to analyze code patterns
2. **Glob Tool** - Identified all relevant files in the repository
3. **Git/Bash** - Branch management and version control

---

## Guideline Compliance Analysis

### 1. General Guidelines

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid global app instance | ✅ Pass | Uses `this.app` throughout, never `app` or `window.app` |
| Avoid unnecessary console logging | ✅ Pass | Only `console.error` for error messages (acceptable per guidelines) |
| Organize code with folders | ✅ N/A | Only one `.ts` file, folders not needed |
| Rename placeholder class names | ✅ Pass | Classes properly named: `DailyWeeklyNotesPlugin`, `DailyWeeklyNotesSettings`, `DailyWeeklyNotesSettingTab` |

### 2. Mobile Compatibility

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid Node.js/Electron APIs | ✅ Pass | No Node.js or Electron APIs used |
| Avoid lookbehind in regex | ✅ Pass | No regular expressions with lookbehind |

### 3. UI Text Guidelines

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid top-level headings in settings | ❌ Fail | Line 215: `createEl('h2', {text: 'Daily & Weekly Notes Settings'})` - Should not have top-level heading |
| Avoid "settings" in headings | ❌ Fail | Heading includes "Settings" in the text |
| Use sentence case in UI | ❌ Fail | Multiple violations (see details below) |
| Use setHeading instead of HTML elements | ❌ Fail | Uses `createEl('h2')` and `createEl('h3')` instead of `Setting.setHeading()` |

**Sentence Case Violations:**
- Line 29: `'Create Daily Note'` → should be `'Create daily note'`
- Line 37: `'Create Weekly Note'` → should be `'Create weekly note'`
- Line 303: `'Common Format Patterns'` → should be `'Common format patterns'`

### 4. Security Guidelines

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid innerHTML/outerHTML/insertAdjacentHTML | ✅ Pass | None of these dangerous methods are used |

### 5. Resource Management

| Guideline | Status | Notes |
|-----------|--------|-------|
| Clean up resources on unload | ✅ Pass | Uses Obsidian's built-in command/settings registration which auto-cleans |
| Don't detach leaves in onunload | ✅ Pass | No onunload defined, no leaves detached |

### 6. Commands

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid default hotkeys | ✅ Pass | No default hotkeys set |
| Use appropriate callback type | ✅ Pass | Uses `callback` appropriately for unconditional commands |

### 7. Workspace

| Guideline | Status | Notes |
|-----------|--------|-------|
| Avoid workspace.activeLeaf directly | ✅ Pass | Uses `this.app.workspace.getLeaf()` correctly |
| Avoid managing custom view references | ✅ N/A | No custom views registered |

### 8. Vault Operations

| Guideline | Status | Notes |
|-----------|--------|-------|
| Prefer Editor API for active file | ⚠️ Edge case | File is opened after modification, so Vault API is acceptable here |
| Use Vault.process instead of Vault.modify | ❌ Fail | Line 181: Uses `vault.modify()` - should use `vault.process()` for atomic operations |
| Use processFrontMatter for frontmatter | ✅ N/A | No frontmatter modification |
| Prefer Vault API over Adapter API | ✅ Pass | Only Vault API is used |
| Avoid iterating all files for path lookup | ✅ Pass | Uses `getAbstractFileByPath()` correctly |
| Use normalizePath() for user paths | ❌ Fail | Lines 71, 88: File paths from user format settings not normalized |

### 9. Editor

| Guideline | Status | Notes |
|-----------|--------|-------|
| Editor extension management | ✅ N/A | No editor extensions used |

### 10. Styling

| Guideline | Status | Notes |
|-----------|--------|-------|
| No hardcoded styling | ✅ Pass | No inline styles in TypeScript; CSS file is empty |

### 11. TypeScript Best Practices

| Guideline | Status | Notes |
|-----------|--------|-------|
| Prefer const/let over var | ✅ Pass | All declarations use `const` or `let` |
| Prefer async/await over Promise | ✅ Pass | async/await used consistently |

---

## Issues Found & Fixes Applied

### Issue 1: Top-level Settings Heading (Severity: Medium)

**Location:** `main.ts:215`

**Problem:**
```typescript
containerEl.createEl('h2', {text: 'Daily & Weekly Notes Settings'});
```

**Guideline Violated:**
- "Avoid adding a top-level heading in the settings tab, such as 'General', 'Settings', or the name of your plugin"
- "Avoid including the word 'settings' to these headings"

**Fix:** Remove the top-level h2 heading entirely. The plugin name is already shown in the settings sidebar.

---

### Issue 2: Section Heading Uses HTML Element (Severity: Medium)

**Location:** `main.ts:303`

**Problem:**
```typescript
containerEl.createEl('h3', {text: 'Common Format Patterns'});
```

**Guideline Violated:**
- "Use setHeading instead of a <h1>, <h2>"
- "Use sentence case in UI"

**Fix:**
```typescript
new Setting(containerEl).setName('Common format patterns').setHeading();
```

---

### Issue 3: Command Names Use Title Case (Severity: Low)

**Location:** `main.ts:29, 37`

**Problem:**
```typescript
name: 'Create Daily Note'
name: 'Create Weekly Note'
```

**Guideline Violated:** "Use Sentence case in UI"

**Fix:**
```typescript
name: 'Create daily note'
name: 'Create weekly note'
```

---

### Issue 4: Using vault.modify Instead of vault.process (Severity: Medium)

**Location:** `main.ts:181`

**Problem:**
```typescript
await this.app.vault.modify(file, newContent);
```

**Guideline Violated:** "Prefer Vault.process instead of Vault.modify to modify a file in the background"

**Fix:**
```typescript
await this.app.vault.process(file, (existingContent) => {
    return content + '\n' + existingContent;
});
```

This change also simplifies the code by eliminating the separate `vault.read()` call.

---

### Issue 5: Missing normalizePath for File Paths (Severity: Low)

**Location:** `main.ts:71, 88`

**Problem:**
```typescript
const filePath = `${fileName}.md`;
```

**Guideline Violated:** "Use normalizePath() to clean up user-defined paths"

**Fix:**
```typescript
import { normalizePath } from 'obsidian';
// ...
const filePath = normalizePath(`${fileName}.md`);
```

---

## Changes Made

### Summary of Code Changes

1. **Removed top-level heading** in settings tab
2. **Converted h3 to setHeading()** for "Common format patterns" section
3. **Changed command names to sentence case**: "Create daily note", "Create weekly note"
4. **Replaced vault.modify with vault.process** for atomic file operations
5. **Added normalizePath()** for file path handling
6. **Updated version to 0.2.1** in manifest.json, package.json, and versions.json

### Files Modified

- `main.ts` - All code changes
- `manifest.json` - Version bump to 0.2.1
- `package.json` - Version bump to 0.2.1
- `versions.json` - Added 0.2.1 entry

---

## Testing Recommendations

Before merging, recommend testing the following:

1. **Daily note creation** - Verify notes are created correctly with new atomic file operations
2. **Weekly note creation** - Verify notes are created correctly
3. **Existing file prepend** - Verify `vault.process()` correctly prepends content to existing files
4. **Settings tab appearance** - Verify headings display correctly without the top-level heading
5. **Command palette** - Verify command names appear in sentence case

---

## Conclusion

The plugin was well-written and already complied with most Obsidian guidelines. The main areas requiring attention were:

1. **UI text formatting** - Title case vs sentence case, HTML headings vs setHeading()
2. **Vault operations** - Using process() for atomic modifications
3. **Path handling** - Using normalizePath() for safety

All identified issues have been addressed in this review. The plugin is now fully compliant with Obsidian's plugin guidelines as documented.
