
## Development Workflow

### Local Development with Yarn Link

#### Step 1: Link Packages for Development
```bash
cd /path/to/garden.js
yarn link:all
```

#### Step 2: Set Up Portal Links in Your Project
```bash
cd /path/to/garden.js
./scripts/portal-setup.sh /path/to/your/project
```

#### Step 3: Install Dependencies
```bash
cd /path/to/your/project
yarn install
```

#### Step 4: Unlink and Restore Production Mode
```bash
cd /path/to/garden.js
yarn unlink:all
```

---

## Technical Summary

**What the scripts do:**

1. **`yarn link:all`** (`scripts/link-packages.sh`):
   - Modifies each package's `package.json` to point to `./src/index.ts` (source files)
   - Creates backups of original `package.json` files
   - Links all packages globally with `yarn link`
   - Adds portal resolutions to garden.js root `package.json`

2. **`portal-setup.sh`**:
   - Adds portal resolutions to your project's `package.json`
   - Creates direct file system links to garden.js packages
   - Installs dependencies with portal links

3. **`yarn unlink:all`**:
   - Unlinks all packages globally
   - Restores original `package.json` files from backups
   - Removes portal resolutions
   - Cleans up backup files

**Result**: Changes to garden.js source files are immediately available in your project without rebuilding or reinstalling.
