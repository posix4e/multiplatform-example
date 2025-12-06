#!/bin/bash
set -e

# E2E Test Runner for Android
#
# This script:
# 1. Verifies backend is running
# 2. Builds and installs the Android app (if needed)
# 3. Runs Maestro E2E tests against real backend
#
# Usage:
#   ./e2e/run-tests.sh           # Run all tests
#   ./e2e/run-tests.sh --build   # Rebuild app first

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$(dirname "$APP_DIR")")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Multiplatform E2E Tests ===${NC}"

# Check if backend is running
echo -n "Checking backend... "
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Backend is not running. Start it with:"
    echo "  pnpm --filter @multiplatform/backend dev"
    exit 1
fi

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}Maestro is not installed.${NC}"
    echo "Install it with:"
    echo "  curl -Ls 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

# Check if Android emulator is running
if ! adb devices | grep -q "emulator"; then
    echo -e "${YELLOW}Warning: No Android emulator detected${NC}"
    echo "Start an emulator or connect a device via ADB"
fi

# Build app if requested
if [[ "$1" == "--build" ]]; then
    echo -e "${YELLOW}Building Android app...${NC}"
    cd "$APP_DIR"
    pnpm tauri android build --debug
fi

# Run E2E tests
echo -e "${YELLOW}Running E2E tests...${NC}"
cd "$SCRIPT_DIR"

maestro test app-launch.yaml

echo -e "${GREEN}=== All E2E tests passed ===${NC}"
