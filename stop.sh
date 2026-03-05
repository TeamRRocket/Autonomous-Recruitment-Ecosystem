#!/bin/bash

# HireFlow - Stop All Services
# This script stops all running services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$LOG_DIR/services.pid"

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}║          🛑 HireFlow - Stopping All Services          ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop services from PID file
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}Stopping tracked services...${NC}"
    while IFS= read -r pid; do
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping process $pid${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        else
            echo -e "${GREEN}Process $pid already stopped${NC}"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
fi

# Kill any remaining node/python processes from our services
echo -e "${YELLOW}Cleaning up remaining processes...${NC}"

# Find and kill vite (frontend)
if pgrep -f "vite" > /dev/null; then
    pkill -f "vite" 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend stopped${NC}"
fi

# Find and kill nodemon/node (backend)
if pgrep -f "nodemon" > /dev/null; then
    pkill -f "nodemon" 2>/dev/null || true
    echo -e "${GREEN}✓ Backend stopped${NC}"
fi

# Find and kill AI service
if pgrep -f "ai-service/main.py" > /dev/null; then
    pkill -f "ai-service/main.py" 2>/dev/null || true
    echo -e "${GREEN}✓ AI Service stopped${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║          ✅ All Services Stopped Successfully          ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
