# Dependency Update Notes - v0.2.0

**Date:** 2026-01-07
**Branch:** `claude/update-dependencies-8xLwR`

## Summary

This document tracks the dependency update process for the obsidian-daily-weekly-notes plugin, updating from v0.1.0 to v0.2.0.

## Goals

1. Update dependencies to match the obsidian-sample-plugin reference
2. Remove unused ESLint packages (no lint script in use)
3. Refactor to use Obsidian's global moment instead of bundled moment
4. Ensure the plugin builds and functions correctly

---

## Analysis Phase

### Current State (v0.1.0)

**package.json devDependencies:**
- `@types/node`: `^16.11.6`
- `@typescript-eslint/eslint-plugin`: `5.29.0` (UNUSED - no lint script)
- `@typescript-eslint/parser`: `5.29.0` (UNUSED - no lint script)
- `builtin-modules`: `3.3.0` (used in esbuild.config.mjs)
- `esbuild`: `0.17.3`
- `obsidian`: `latest`
- `tslib`: `2.4.0`
- `typescript`: `4.7.4`

**package.json dependencies:**
- `moment`: `^2.29.4` (bundled into main.js, ~70KB)

### Sample Plugin Reference (obsidian-sample-plugin)

**package.json devDependencies:**
- `@types/node`: `^16.11.6`
- `esbuild`: `0.25.5`
- `eslint-plugin-obsidianmd`: `0.1.9` (new ESLint setup)
- `globals`: `14.0.0`
- `tslib`: `2.4.0`
- `typescript`: `^5.8.3`
- `typescript-eslint`: `8.35.1`
- `@eslint/js`: `9.30.1`
- `jiti`: `2.6.1`

**package.json dependencies:**
- `obsidian`: `latest`

**Key differences:**
- Sample plugin has `"type": "module"` in package.json
- Sample plugin uses `builtinModules` from `node:module` (Node.js built-in) instead of `builtin-modules` npm package
- Sample plugin adds `minify: prod` in esbuild config for production builds

---

## Changes Made

### 1. esbuild.config.mjs

**Before:**
```javascript
import builtins from "builtin-modules";
// ...
external: [...builtins]
```

**After:**
```javascript
import { builtinModules } from 'node:module';
// ...
external: [...builtinModules]
// Added: minify: prod
```

**Reasoning:** The sample plugin uses Node.js built-in `builtinModules` instead of the npm package `builtin-modules`. This removes a dependency and uses the native Node.js API.

### 2. main.ts - Moment.js Refactoring

**Before:**
```typescript
import moment from 'moment';
// ...
const today = moment();
// ...
generateDailyNoteContent(date: moment.Moment): string
```

**After:**
```typescript
import type { Moment } from 'moment';

// Use Obsidian's global moment instance (provided by Obsidian at runtime)
declare const moment: typeof import('moment');
// ...
const today = moment();
// ...
generateDailyNoteContent(date: Moment): string
```

**Reasoning:** Obsidian provides `moment` as a global at runtime. By using the global instead of bundling moment, we:
- Reduce bundle size significantly (~150KB to ~7KB)
- Use the same moment instance as Obsidian core
- Follow the recommended pattern for Obsidian plugins

### 3. package.json

**Changes:**
- Added `"type": "module"` (matches sample plugin)
- Updated `version` to `"0.2.0"`
- Updated `esbuild` from `0.17.3` to `0.25.5`
- Updated `typescript` from `4.7.4` to `^5.8.3`
- Removed `@typescript-eslint/eslint-plugin` (unused - no lint script)
- Removed `@typescript-eslint/parser` (unused - no lint script)
- Removed `builtin-modules` (replaced with Node.js built-in)
- Moved `obsidian` from `devDependencies` to `dependencies`
- Removed `moment` from `dependencies` (using global)

### 4. manifest.json

**Change:** Updated `version` to `"0.2.0"`

---

## Implementation Log

### Step 1: Read Source Files
- **Tool:** Read
- **Files:** package.json, main.ts, manifest.json, esbuild.config.mjs
- **Output:** Successfully read all files, confirmed current state matches expected
- **Status:** ✅ COMPLETED

### Step 2: Update esbuild.config.mjs
- **Tool:** Edit
- **Changes:**
  - Replace `import builtins from "builtin-modules"` with `import { builtinModules } from 'node:module'`
  - Replace `...builtins` with `...builtinModules`
  - Add `minify: prod` option
- **Status:** ✅ COMPLETED

### Step 3: Refactor main.ts for global moment
- **Tool:** Edit
- **Changes:**
  - Removed `import moment from 'moment'`
  - Added `import type { Moment } from 'moment'` for type imports only
  - Added `declare const moment: typeof import('moment')` for global declaration
  - Replaced `moment.Moment` type references with `Moment`
- **Note:** Initially tried importing `moment` from 'obsidian' but TypeScript reported "has no call signatures". Solution was to declare moment as a global with the correct type.
- **Status:** ✅ COMPLETED

### Step 4: Update package.json
- **Tool:** Write
- **Changes:** Updated version, dependencies as listed above
- **Status:** ✅ COMPLETED

### Step 5: Update manifest.json
- **Tool:** Edit
- **Changes:** Updated version to 0.2.0
- **Status:** ✅ COMPLETED

### Step 6: Install dependencies
- **Tool:** Bash
- **Command:** `rm -rf node_modules package-lock.json && npm install`
- **Output:**
  ```
  added 16 packages, and audited 17 packages in 5s
  found 0 vulnerabilities
  ```
- **Status:** ✅ COMPLETED

### Step 7: Build and verify
- **Tool:** Bash
- **Command:** `npm run build`
- **Output:** Build completed successfully (TypeScript check passed, esbuild bundled)
- **Status:** ✅ COMPLETED

---

## Verification Results

- [x] All files updated correctly
- [x] `npm install` completes without errors (16 packages, 0 vulnerabilities)
- [x] `npm run build` completes without errors
- [x] TypeScript type checking passes
- [x] Built main.js does not include bundled moment.js
- [x] manifest.json version matches package.json version (0.2.0)

### Bundle Size Comparison

| Metric | Before (v0.1.0) | After (v0.2.0) | Improvement |
|--------|-----------------|----------------|-------------|
| main.js size | 158,767 bytes | 7,346 bytes | **95% reduction** |
| main.js lines | 4,261 lines | 26 lines | **99% reduction** |
| moment bundled | Yes (~70KB) | No (uses global) | ✅ |
| Production minified | No | Yes | ✅ |

---

## Final Package.json

```json
{
  "name": "obsidian-daily-weekly-notes",
  "version": "0.2.0",
  "description": "Obsidian plugin for creating templated daily and weekly notes",
  "main": "main.js",
  "type": "module",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
    "version": "node version-bump.mjs && git add manifest.json versions.json"
  },
  "keywords": [],
  "author": "Nathan Hominiuk",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^16.11.6",
    "esbuild": "0.25.5",
    "tslib": "2.4.0",
    "typescript": "^5.8.3"
  },
  "dependencies": {
    "obsidian": "latest"
  }
}
```

---

## Risk Assessment

**Low Risk:**
- Updating esbuild and typescript versions (standard upgrades) ✅
- Removing unused ESLint packages ✅

**Medium Risk:**
- Switching to global moment - requires code changes but is standard practice ✅

**Mitigation:**
- Full build verification completed successfully
- Changes can be easily reverted if issues found in testing

---

## Notes

1. The `moment` global is provided by Obsidian at runtime. The type declaration `declare const moment: typeof import('moment')` allows TypeScript to understand the global while the actual moment.js library is not bundled.

2. The obsidian package (which is in dependencies) includes moment types, so `import type { Moment } from 'moment'` works for type-only imports.

3. Production builds now include minification (`minify: prod` in esbuild config), matching the sample plugin.

---

*Implementation completed: 2026-01-07*
