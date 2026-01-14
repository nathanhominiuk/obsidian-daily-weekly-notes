# Contributing to Daily & Weekly Notes Creator

## Pull Request Checklist

Before submitting or merging a PR, ensure the following are completed:

### Version & Changelog (Required for all PRs)

- [ ] **CHANGELOG.md updated** - Add an entry under the appropriate version with:
  - 2-4 bullet points summarizing changes
  - Use categories: Added, Changed, Fixed, Removed, Security
  - Follow [Keep a Changelog](https://keepachangelog.com/) format

- [ ] **PR labeled for SemVer** - Apply one of these labels:
  - `major` - Breaking changes (1.0.0 → 2.0.0)
  - `minor` - New features, backwards compatible (0.2.0 → 0.3.0)
  - `patch` - Bug fixes, minor improvements (0.2.1 → 0.2.2)
  - Default is `patch` if no label specified

### Automated Versioning

Version bumping is handled automatically by GitHub Actions when PRs are merged:
1. The `version-bump.yml` workflow detects PR labels
2. Updates `package.json`, `manifest.json`, and `versions.json`
3. Creates a git tag and pushes it
4. The `release.yml` workflow creates a draft GitHub release

**Note:** Manual version bumps are not required. The automation handles this.

### Code Quality

- [ ] Code builds without errors (`npm run build`)
- [ ] No new TypeScript errors
- [ ] Follows [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

## SemVer Guidelines

This project follows [Semantic Versioning](https://semver.org/):

| Change Type | Version Bump | Examples |
|-------------|--------------|----------|
| Breaking API changes | Major | Removing features, changing settings schema |
| New features | Minor | New commands, new settings options |
| Bug fixes | Patch | Fixing errors, UI corrections |
| Dependencies | Patch | Updating build tools, libraries |
| Documentation | Patch | README updates, code comments |
| CI/CD changes | Patch | Workflow improvements |

## Reminder for AI Assistants

When working on this repository:
1. **Always update CHANGELOG.md** with a summary of changes
2. **Apply the correct SemVer label** to PRs
3. **Do not manually bump versions** - automation handles this
4. **Review the PR checklist** before marking work complete
