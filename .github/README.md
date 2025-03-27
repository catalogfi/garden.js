# 🚀 Monorepo Automated Release Workflow

This repository uses a custom shell script and GitHub Actions workflow to automate **version bumping**, **build**, and **publishing** of packages in a Yarn monorepo. It supports both **stable** and **beta** releases triggered via commits and PR comments.

---

## 📦 Features

- Auto detects version bump based on commit messages (`feat:`, `fix:`, `patch:`, `chore:`).
- Publishes to NPM with support for:
  - 🔹 Stable releases (on `main` push)
  - 🔸 Beta releases (via PR comment `/release-beta`)
- Handles prerelease versions like `1.2.3-beta.0`, `1.2.3-beta.1`, etc.
- Git tagging and pushing handled automatically.
- Prevents release from unauthorized PR commenters.

---

## 🛠️ How it works

### 🔁 On `push` to `main`:
- Parses the latest commit message to determine version bump.
- Bumps package versions.
- Builds and publishes each public package to NPM satisfying the dependency cycle.
- Commits version changes and pushes Git tags.

### 🗣️ On PR comment `/release-beta`:
- Validates the commenter has `admin` or `maintain` access.
- Publishes a beta version with `--tag beta`.

---

## 📝 Commit Message Conventions

| Prefix     | Bump Type   |
|------------|-------------|
| `feat:`    | Major       |
| `fix:`     | Minor       |
| `patch:`   | Patch       |
| `chore:`   | Patch       |

Example:  
```bash
git commit -m "feat: add new feature"
```

---

## 🔐 Required Secrets

| Secret Name     | Purpose                        |
|------------------|-------------------------------|
| `GH_PAT`         | GitHub token for pushing tags |
| `NPM_TOKEN`      | NPM token for publishing      |

---

## 📁 File Structure

```
scripts/
  └── handle-release.sh     # Core release automation script

.github/
  └── workflows/
        └── release.yml     # GitHub Actions workflow
```

---

## ✅ Notes

- The release script skips publishing for commits without valid prefixes.
- Ensures only stable releases are tagged and pushed on `main`.
- Auto-unsets `yarnPath` and removes `packageManager` field after install to avoid lock-in.
