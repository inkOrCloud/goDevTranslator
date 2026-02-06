#!/bin/bash
# Local test script for release workflow logic
# This script simulates the version checking and changelog generation steps
# without actually creating a release.

set -e

echo "=== Testing Release Workflow Logic ==="

# Get current version (using node if jq not available)
if command -v jq &> /dev/null; then
    CURRENT_VERSION=$(jq -r .version package.json)
elif command -v node &> /dev/null; then
    CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
else
    echo "Error: Need jq or node to parse package.json"
    exit 1
fi
echo "Current version in package.json: $CURRENT_VERSION"

# Get latest release tag
LATEST_TAG=$(git tag --list 'v*' --sort=-v:refname | head -1)
if [ -z "$LATEST_TAG" ]; then
    echo "No existing release tag found"
    PREVIOUS_VERSION=""
else
    echo "Latest release tag: $LATEST_TAG"
    PREVIOUS_VERSION="${LATEST_TAG#v}"
    echo "Previous version from tag: $PREVIOUS_VERSION"
fi

# Check if version changed
if [ -z "$PREVIOUS_VERSION" ]; then
    echo "✓ Would create first release (v$CURRENT_VERSION)"
    CREATE_RELEASE=true
    RELEASE_TAG="v$CURRENT_VERSION"
elif [ "$CURRENT_VERSION" != "$PREVIOUS_VERSION" ]; then
    echo "✓ Version changed from $PREVIOUS_VERSION to $CURRENT_VERSION"
    CREATE_RELEASE=true
    RELEASE_TAG="v$CURRENT_VERSION"
else
    echo "✗ Version unchanged ($CURRENT_VERSION). No release needed."
    CREATE_RELEASE=false
fi

if [ "$CREATE_RELEASE" = true ]; then
    echo ""
    echo "=== Simulated Changelog ==="
    if [ -z "$LATEST_TAG" ]; then
        echo "First release - all commits:"
        git log --oneline --format="- %s" | head -20
    else
        echo "Changes since $LATEST_TAG:"
        git log --oneline --format="- %s" "$LATEST_TAG..HEAD"
    fi
    echo ""
    echo "Would create release tag: $RELEASE_TAG"
fi

echo ""
echo "=== Workflow File Check ==="
if [ -f ".github/workflows/release-on-version-change.yml" ]; then
    echo "✓ Workflow file exists"
    # Validate YAML syntax if yq or python available
    if command -v python3 &> /dev/null; then
        python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release-on-version-change.yml'))" && echo "✓ Valid YAML syntax"
    else
        echo "  (Install python3 with PyYAML to validate YAML syntax)"
    fi
else
    echo "✗ Workflow file missing"
fi