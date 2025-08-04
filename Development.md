
## Development Workflow

### Local Development with Yarn Link

For local development, you can link the GardenJS packages to your project for immediate reflection of changes without rebuilding or reinstalling.

#### Step 1: Link Packages for Development

```bash
# Navigate to garden.js repository
cd /path/to/garden.js

# Link all packages for development (uses source files)
yarn link:all
```

This will:
- Set up all packages to point to source files (`./src/index.ts`)
- Create backup files of original package.json configurations
- Link all packages globally
- Add portal resolutions to garden.js package.json

#### Step 2: Set Up Portal Links in Your Project

```bash
# Navigate to garden.js repository
cd /path/to/garden.js

# Set up portal links to garden.js packages
./scripts/portal-setup.sh /path/to/your/project
```

This will:
- Add portal resolutions to your project's package.json
- Create direct links to garden.js source files
- Install dependencies with portal links

#### Step 3: Install Dependencies

```bash
# Install dependencies with portal links
yarn install
```

#### Step 4: Development Workflow

Now you can:
- Make changes in garden.js source files
- Save files
- Changes immediately reflect in your project
- No need to run `yarn install` or rebuild packages

#### Step 5: Unlink and Restore Production Mode

When you're done with development:

```bash
# Navigate back to garden.js repository
cd /path/to/garden.js

# Unlink packages and restore production mode
yarn unlink:all
```

This will:
- Build all packages for production
- Unlink all packages globally
- Restore original package.json files from backups
- Remove portal resolutions
- Clean up backup files
