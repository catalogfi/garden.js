#!/bin/bash

# Script to link all GardenJS packages globally
# Usage: ./scripts/link-packages.sh [link|unlink]

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

cd "$PROJECT_ROOT"

add_portal_resolutions() {
    print_status "Adding portal resolutions to garden.js package.json..."
    
    cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.prod"
    
    cat > "$PROJECT_ROOT/temp_modify_package.js" << 'EOF'
const fs = require('fs');
const path = require('path');

const packagePath = process.argv[2];
const projectRoot = process.argv[3];

try {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add portal resolutions
  packageJson.resolutions = {
    "@gardenfi/core": `portal:${projectRoot}/packages/core`,
    "@gardenfi/orderbook": `portal:${projectRoot}/packages/orderbook`,
    "@gardenfi/react-hooks": `portal:${projectRoot}/packages/react-hooks`,
    "@gardenfi/utils": `portal:${projectRoot}/packages/utils`,
    "@gardenfi/wallet-connectors": `portal:${projectRoot}/packages/walletConnectors`
  };
  
  // Write back to file with proper formatting
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Successfully added portal resolutions');
} catch (error) {
  console.error('Error modifying package.json:', error.message);
  process.exit(1);
}
EOF
    
    node "$PROJECT_ROOT/temp_modify_package.js" "$PROJECT_ROOT/package.json" "$PROJECT_ROOT"
    
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
    print_success "Backup file cleaned up"
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
    
    packages=("core" "orderbook" "react-hooks" "utils" "walletConnectors")
    
    for package in "${packages[@]}"; do
        if [ -d "packages/$package" ]; then
            case $package in
                "walletConnectors")
                    package_name="@gardenfi/wallet-connectors"
                    ;;
                *)
                    package_name="@gardenfi/$package"
                    ;;
            esac
            
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
    
    print_success "All packages linked for development successfully!"
    print_status "Portal resolutions added to garden.js package.json"
    print_warning "Note: This links directly to source files. Make sure your consuming project can handle TypeScript files."
}

unlink_packages() {
    print_status "Unlinking all GardenJS packages and restoring production mode..."
    
    packages=("core" "orderbook" "react-hooks" "utils" "walletConnectors")
    
    for package in "${packages[@]}"; do
        if [ -d "packages/$package" ]; then
            case $package in
                "walletConnectors")
                    package_name="@gardenfi/wallet-connectors"
                    ;;
                *)
                    package_name="@gardenfi/$package"
                    ;;
            esac
            
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
    
    remove_portal_resolutions
    
    print_success "All packages unlinked and restored to production mode!"
    print_status "Portal resolutions removed from garden.js package.json"
}

show_usage() {
    echo "Usage: $0 [link|unlink]"
    echo ""
    echo "Commands:"
    echo "  link      - Link all GardenJS packages globally for development (source files)"
    echo "  unlink    - Unlink all GardenJS packages globally and restore production mode (built files)"
    echo ""
    echo "Examples:"
    echo "  $0 link"
    echo "  $0 unlink"
    echo ""
    echo "This script will:"
    echo "  link:"
    echo "    1. Set up all packages for development (point to source files)"
    echo "    2. Create backup files (package.json.prod) for each package"
    echo "    3. Link all packages globally"
    echo "    4. Add portal resolutions to garden.js package.json"
    echo ""
    echo "  unlink:"
    echo "    1. Build all packages for production"
    echo "    2. Unlink all packages globally"
    echo "    3. Restore all packages to production mode (point to built files)"
    echo "    4. Delete backup files after restoration"
    echo "    5. Remove portal resolutions from garden.js package.json"
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