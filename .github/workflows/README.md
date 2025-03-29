# 🚀 Monorepo Automated Release Workflow

This repository uses a custom shell script and GitHub Actions workflow to automate **version bumping**, **build**, and **publishing** of packages in a Yarn monorepo. It supports both **stable** and **beta** releases triggered via commits and PR comments.

---

## Beta release

- After creating a PR, the repository admin or maintainer should comment `/release-beta` on the PR.
- The workflow will build and publish a beta version to NPM.

## Stable release

- The workflow will build and publish a stable version to NPM based on the commit message. The commit message conventions are shown below.

| Prefix   | Bump Type |
| -------- | --------- |
| `feat:`  | Major     |
| `fix:`   | Minor     |
| `patch:` | Patch     |
| `chore:` | Patch     |

---
