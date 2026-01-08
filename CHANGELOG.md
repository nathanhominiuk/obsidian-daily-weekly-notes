# Changelog

All notable changes to the Daily & Weekly Notes Creator plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-01-08

### Added
- GitHub Actions workflow for automated releases
- Auto-versioning on PR merge using Semantic Versioning
- PR labels (`major`, `minor`, `patch`) to control version bump type

### Changed
- Build process migrated from manual Podman builds to GitHub Actions
- Releases are now created automatically as drafts when PRs are merged

## [0.1.0] - 2026-01-06

### Added
- Initial beta release
- Create daily notes with customizable date format
- Create weekly notes with ISO week numbering
- Automatic cross-linking between daily and weekly notes
- Settings panel for customizing date formats
- Live preview of date format changes in settings
- Support for ISO week years (GGGG) to handle year boundaries correctly
- Error handling for invalid formats and file operations
- Settings validation and sanitization
- Mobile compatibility

### Features
- Daily notes include:
  - Formatted date header
  - Link to current week's weekly note
  - Links to yesterday and tomorrow
- Weekly notes include:
  - Date range for the week
  - Links to last and next week
  - Links to all 7 daily notes (Monday through Sunday)
- Intelligent date range formatting (abbreviates end date when in same month)
- Prepends template to existing notes instead of overwriting

### Technical
- Uses Moment.js for date handling
- TypeScript with strict type checking
- Error handling with user-friendly notifications
- Settings persistence via Obsidian's data.json
- Works on both desktop and mobile

## [Unreleased]

### Planned Features
- Custom folder locations for daily and weekly notes
- Customizable templates
- Support for monthly notes
- Support for quarterly notes
- Date format presets
