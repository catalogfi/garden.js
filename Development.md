
## Development Workflow

### Quick Start

#### Setup Development Environment
```bash
cd /path/to/garden.js
yarn link:all /path/to/your/project
```

**Note**: If no target project path is provided, the script will default to `../garden-kiosk` relative to the current directory.

#### Development
- Make changes in garden.js source files
- Changes immediately reflect in your project

#### Cleanup
```bash
cd /path/to/garden.js
yarn unlink:all
```

---

### Detailed Workflow

#### Step 1: Set Up Development Environment (One Command)
```bash
cd /path/to/garden.js
yarn link:all /path/to/your/project
```

**Default Target**: If no target project path is specified, the script defaults to `../garden-kiosk` relative to the current directory.

This single command will:
- Automatically detect all packages in `packages/` directory (excluding `test`)
- Link all packages in garden.js
- Set up portal links in your project
- Install dependencies in your project

#### Step 2: Development Workflow
- Make changes in garden.js source files
- Save files
- Changes immediately reflect in your project
- No need to run `yarn install` or rebuild packages

#### Step 3: Clean Up Development Environment (One Command)
```bash
cd /path/to/garden.js
yarn unlink:all
```

This single command will:
- Unlink all packages globally
- Restore garden.js to production mode
- Revert portal resolutions in your project
- Clean up all backup files

---

## Technical Summary

**What the scripts do:**

1. **`yarn link:all [path/to/project]`** (Dynamic script):
   - **Target Project**: Accepts an optional target project path. If not provided, defaults to `../garden-kiosk`
   - Automatically detects all packages in `packages/` directory
   - Reads package names from each package's `package.json`
   - Modifies each package's `package.json` to point to `./src/index.ts` (source files)
   - Creates backups of original `package.json` files
   - Links all packages globally with `yarn link`
   - Adds dynamic portal resolutions to garden.js root `package.json`
   - Sets up portal links in target project
   - Installs dependencies in target project

2. **`yarn unlink:all`** (Dynamic script):
   - Automatically detects all packages in `packages/` directory
   - Unlinks all packages globally
   - Restores original `package.json` files from backups
   - Removes portal resolutions from garden.js root `package.json`
   - Reverts portal resolutions in target project (restores from backup)
   - Cleans up all backup files

**Key Features:**
- **Dynamic Package Detection**: Automatically finds all packages (excluding `test`)
- **Flexible Naming**: Supports any package directory name
- **Automatic Setup**: One command handles everything
- **Complete Cleanup**: Restores both garden.js and target project to original state

**Result**: Changes to garden.js source files are immediately available in your project without rebuilding or reinstalling. When cleaning up, both garden.js and your project are restored to their original state.
