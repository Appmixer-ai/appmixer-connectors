#!/bin/bash
set -e

# Script to install npm dependencies in all connector package.json files
# Processes up to 5 package.json files in parallel

# Find all package.json files in src/appmixer/**/package.json
# Exclude root package.json and node_modules directories
PACKAGE_FILES=$(find src/appmixer -name "package.json" -not -path "*/node_modules/*" | sort)

if [ -z "$PACKAGE_FILES" ]; then
    echo "No package.json files found in src/appmixer/"
    exit 0
fi

echo "Found $(echo "$PACKAGE_FILES" | wc -l) package.json files to process"

# Function to run npm install in a directory
install_deps() {
    local package_file=$1
    local dir=$(dirname "$package_file")
    echo "Installing dependencies in $dir..."
    (cd "$dir" && npm install --no-package-lock --silent --no-audit --no-fund) && echo "✓ Completed: $dir" || echo "✗ Failed: $dir"
}

export -f install_deps

# Run npm install in parallel with max 10 processes at a time
echo "$PACKAGE_FILES" | xargs -P 10 -I {} bash -c 'install_deps "$@"' _ {}

echo "All dependencies installed successfully"
