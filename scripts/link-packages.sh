#!/bin/bash

# Script to link all GardenJS packages globally

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_PROJECT_PATH="${2:-$(pwd)/../garden-kiosk}"

cd "$PROJECT_ROOT"

get_target_path() {
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        node -p "require('./package.json').targetProjectPath || ''" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Revert portal resolutions in target project
revert_target_project_resolutions() {
    local target_path=$(get_target_path)
    
    if [ -n "$target_path" ] && [ -d "$target_path" ]; then
        print_status "Reverting portal resolutions in target project: $target_path"
        
        if [ -f "$target_path/package.json.backup" ]; then
            cp "$target_path/package.json.backup" "$target_path/package.json"
            rm "$target_path/package.json.backup"
            cd "$target_path"
            yarn install
            cd "$PROJECT_ROOT"
            print_success "Reverted portal resolutions in target project"
        else
            print_warning "No backup found for target project, skipping reversion"
        fi
    else
        print_warning "No target project path found or directory doesn't exist, skipping target project reversion"
    fi
}

add_portal_resolutions() {
    print_status "Adding portal resolutions to garden.js package.json..."
    
    cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.prod"
    
        cat > "$PROJECT_ROOT/temp_modify_package.js" << 'EOF'
const fs = require('fs');
const path = require('path');

const packagePath = process.argv[2];
const projectRoot = process.argv[3];
const targetProjectPath = process.argv[4];

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Dynamically generate portal resolutions
  const packagesDir = path.join(projectRoot, 'packages');
  const resolutions = {};
  
  if (fs.existsSync(packagesDir)) {
    const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'test')
      .map(dirent => dirent.name);
    
    for (const packageDir of packageDirs) {
      let npmPackageName;
      npmPackageName = `@gardenfi/${packageDir}`;
      resolutions[npmPackageName] = `portal:${projectRoot}/packages/${packageDir}`;
    }
  }
  
  // Add portal resolutions
  packageJson.targetProjectPath = targetProjectPath;
  packageJson.resolutions = resolutions;
  
  // Write back to file with proper formatting
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Successfully added portal resolutions');
} catch (error) {
  console.error('Error modifying package.json:', error.message);
  process.exit(1);
}
EOF
    
    node "$PROJECT_ROOT/temp_modify_package.js" "$PROJECT_ROOT/package.json" "$PROJECT_ROOT" "$TARGET_PROJECT_PATH"
    
    rm "$PROJECT_ROOT/temp_modify_package.js"
    
    print_success "Added portal resolutions to garden.js package.json"
}

remove_portal_resolutions() {
    print_status "Removing portal resolutions from garden.js package.json..."
    
    if [ ! -f "$PROJECT_ROOT/package.json.prod" ]; then
        print_warning "No backup found, creating one from current package.json..."
        cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.prod"
    fi
    
    cp "$PROJECT_ROOT/package.json.prod" "$PROJECT_ROOT/package.json"
    
    rm "$PROJECT_ROOT/package.json.prod"
    
    print_success "Removed portal resolutions from garden.js package.json"
}

setup_package_for_dev() {
    local package=$1
    local package_name=$2
    
    print_status "Setting up $package_name for development (source files)..."
    cd "packages/$package"
    
    # Create backup of original package.json only if it doesn't exist
    if [ ! -f "package.json.prod" ]; then
        cp package.json package.json.prod
        print_status "Created backup of original package.json"
    else
        print_status "Backup already exists, skipping backup creation"
    fi
    
    # Create development version pointing to source files
    cat > package.json.dev << EOF
{
  "name": "$package_name",
  "version": "$(node -p "require('./package.json').version")",
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "typings": "./src/index.ts",
  "exports": {
    ".": {
      "require": "./src/index.ts",
      "import": "./src/index.ts",
      "types": "./src/index.ts",
      "development": "./src/index.ts"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": $(node -p "JSON.stringify(require('./package.json').scripts)"),
  "dependencies": $(node -p "JSON.stringify(require('./package.json').dependencies || {})"),
  "devDependencies": $(node -p "JSON.stringify(require('./package.json').devDependencies || {})"),
  "publishConfig": $(node -p "JSON.stringify(require('./package.json').publishConfig || {})"),
  "sideEffects": $(node -p "JSON.stringify(require('./package.json').sideEffects || false)")
}
EOF
    
    mv package.json.dev package.json
    
    cd "$PROJECT_ROOT"
    print_success "Set up $package_name for development"
}

restore_package_to_prod() {
    local package=$1
    local package_name=$2
    
    print_status "Restoring $package_name to production (built files)..."
    cd "packages/$package"
    
    if [ -f "package.json.prod" ]; then
        mv package.json.prod package.json
        print_success "Restored $package_name from backup"
    else
        print_warning "No backup found for $package_name, skipping restoration"
    fi
    
    cd "$PROJECT_ROOT"
}

link_packages() {
    print_status "Linking all GardenJS packages globally for development..."
    
    # Dynamically detect packages (exclude 'test' directory)
    packages=()
    for dir in packages/*/; do
        if [ -d "$dir" ]; then
            package_name=$(basename "$dir")
            if [ -f "$dir/package.json.prod" ]; then
                print_warning "package.json.prod file found for $package_name, skipping link"
                continue
            fi
            
            if [ "$package_name" != "test" ]; then
                packages+=("$package_name")
            fi
        fi
    done
    
    print_status "Found packages: ${packages[*]}"
    
    for package in "${packages[@]}"; do
        if [ -d "packages/$package" ]; then            
            package_name=$(jq -r .name "packages/$package/package.json")            
            setup_package_for_dev "$package" "$package_name"
            
            print_status "Linking $package_name..."
            cd "packages/$package"
            yarn link
            cd "$PROJECT_ROOT"
            print_success "Linked $package_name"
        else
            print_warning "Package $package not found, skipping..."
        fi
    done
    
    add_portal_resolutions

    ./scripts/portal-setup.sh "$TARGET_PROJECT_PATH"
    
    print_success "All packages linked for development successfully!"
}

unlink_packages() {
    print_status "Unlinking all GardenJS packages and restoring production mode..."
    
    # Dynamically detect packages (exclude 'test' directory)
    packages=()
    for dir in packages/*/; do
        if [ -d "$dir" ]; then
            package_name=$(basename "$dir")
            if [ "$package_name" != "test" ]; then
                packages+=("$package_name")
            fi
        fi
    done
    
    print_status "Found packages: ${packages[*]}"
    
    for package in "${packages[@]}"; do
        if [ -d "packages/$package" ]; then
            package_name=$(jq -r .name "packages/$package/package.json")
            
            # Unlink the package
            print_status "Unlinking $package_name..."
            cd "packages/$package"
            yarn unlink 2>/dev/null || print_warning "Package $package_name was not linked"
            cd "$PROJECT_ROOT"
            print_success "Unlinked $package_name"
            
            # Restore package to production mode
            restore_package_to_prod "$package" "$package_name"
        else
            print_warning "Package $package not found, skipping..."
        fi
    done
    
    revert_target_project_resolutions
    remove_portal_resolutions

    yarn install
    print_success "All packages unlinked and restored to production mode!"
}

show_usage() {
    echo "Usage for link: $0 [link] [target_project_path]"
    echo "Usage for unlink: $0 [unlink]"
    echo ""
    echo "Commands:"
    echo "  link <path/to/project>    - Link packages and set up portal for target project"
    echo "  unlink         - Unlink packages and revert all changes"
}

case "${1:-}" in
    "link")
        link_packages
        ;;
    "unlink")
        unlink_packages
        ;;
    *)
        show_usage
        exit 1
        ;;
esac