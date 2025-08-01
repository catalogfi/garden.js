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
    
    cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.backup"
    
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
    
    if [ ! -f "$PROJECT_ROOT/package.json.backup" ]; then
        print_warning "No backup found, creating one from current package.json..."
        cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/package.json.backup"
    fi
    
    cp "$PROJECT_ROOT/package.json.backup" "$PROJECT_ROOT/package.json"
    
    rm "$PROJECT_ROOT/package.json.backup"
    
    print_success "Removed portal resolutions from garden.js package.json"
    print_success "Backup file cleaned up"
}

link_packages() {
    print_status "Linking all GardenJS packages globally..."
    
    print_status "Building all packages..."
    yarn build
    
    add_portal_resolutions
    
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
            
            print_status "Linking $package_name..."
            cd "packages/$package"
            yarn link
            cd "$PROJECT_ROOT"
            print_success "Linked $package_name"
        else
            print_warning "Package $package not found, skipping..."
        fi
    done
    
    print_success "All packages linked successfully!"
    print_status "Portal resolutions added to garden.js package.json"
    print_status "You can now use these packages in other projects with:"
    print_status "./scripts/portal-setup.sh /path/to/your/project"
}

unlink_packages() {
    print_status "Unlinking all GardenJS packages..."
    
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
            
            print_status "Unlinking $package_name..."
            cd "packages/$package"
            yarn unlink 2>/dev/null || print_warning "Package $package_name was not linked"
            cd "$PROJECT_ROOT"
            print_success "Unlinked $package_name"
        else
            print_warning "Package $package not found, skipping..."
        fi
    done
    
    remove_portal_resolutions
    
    print_success "All packages unlinked successfully!"
    print_status "Portal resolutions removed from garden.js package.json"
}

show_usage() {
    echo "Usage: $0 [link|unlink]"
    echo ""
    echo "Commands:"
    echo "  link    - Link all GardenJS packages globally and add portal resolutions"
    echo "  unlink  - Unlink all GardenJS packages globally and remove portal resolutions"
    echo ""
    echo "Examples:"
    echo "  $0 link"
    echo "  $0 unlink"
    echo ""
    echo "This script will:"
    echo "  1. Build all packages"
    echo "  2. Add/remove portal resolutions to garden.js package.json"
    echo "  3. Link/unlink all packages globally"
    echo ""
    echo "After linking, other projects can use:"
    echo "  yarn link @gardenfi/core"
    echo "  yarn link @gardenfi/orderbook"
    echo "  yarn link @gardenfi/react-hooks"
    echo "  yarn link @gardenfi/utils"
    echo "  yarn link @gardenfi/wallet-connectors"
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