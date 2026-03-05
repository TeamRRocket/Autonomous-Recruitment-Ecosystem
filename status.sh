#!/bin/bash

# HireFlow - Check Service Status
# This script checks the status of all services

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
echo -e "${CYAN}║          📊 HireFlow - Service Status Check           ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to check service health
check_health() {
    local url=$1
    local service=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service is ${GREEN}healthy${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $service is ${RED}not responding${NC}"
        return 1
    fi
}

# Check tracked PIDs
echo -e "${CYAN}📋 Tracked Processes:${NC}"
if [ -f "$PID_FILE" ]; then
    while IFS= read -r pid; do
        if ps -p "$pid" > /dev/null 2>&1; then
            cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo -e "   ${GREEN}✓${NC} PID $pid ($cmd) is running"
        else
            echo -e "   ${RED}✗${NC} PID $pid is not running"
        fi
    done < "$PID_FILE"
else
    echo -e "   ${YELLOW}⚠${NC}  No PID file found (services may not be running)"
fi

echo ""

# Check backend
echo -e "${CYAN}🔍 Checking Services:${NC}"
echo ""

echo -e "${YELLOW}Backend (Port 3000):${NC}"
if check_port 3000; then
    echo -e "   ${GREEN}✓${NC} Port 3000 is in use"
    check_health "http://localhost:3000/api/health" "Backend API" || true
else
    echo -e "   ${RED}✗${NC} Backend is ${RED}not running${NC} (port 3000 not in use)"
fi

echo ""

echo -e "${YELLOW}Frontend (Port 5173):${NC}"
if check_port 5173; then
    echo -e "   ${GREEN}✓${NC} Port 5173 is in use"
    echo -e "   ${GREEN}✓${NC} Frontend is ${GREEN}running${NC}"
elif check_port 5174; then
    echo -e "   ${GREEN}✓${NC} Port 5174 is in use (alternative port)"
    echo -e "   ${GREEN}✓${NC} Frontend is ${GREEN}running${NC}"
else
    echo -e "   ${RED}✗${NC} Frontend is ${RED}not running${NC}"
fi

echo ""

echo -e "${YELLOW}AI Service (Port 8000):${NC}"
if check_port 8000; then
    echo -e "   ${GREEN}✓${NC} Port 8000 is in use"
    check_health "http://localhost:8000/health" "AI Service" || true
else
    echo -e "   ${RED}✗${NC} AI Service is ${RED}not running${NC} (port 8000 not in use)"
fi

echo ""

# Check database connectivity
echo -e "${CYAN}🔍 Checking Dependencies:${NC}"
echo ""

echo -e "${YELLOW}PostgreSQL:${NC}"
if command -v psql >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} PostgreSQL client is installed"
else
    echo -e "   ${YELLOW}⚠${NC}  PostgreSQL client not found in PATH"
fi

echo ""

echo -e "${YELLOW}Redis:${NC}"
if command -v redis-cli >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Redis client is installed"
    if redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "   ${GREEN}✓${NC} Redis is ${GREEN}running${NC}"
    else
        echo -e "   ${YELLOW}⚠${NC}  Redis is not responding"
    fi
else
    echo -e "   ${YELLOW}⚠${NC}  Redis client not found in PATH"
fi

echo ""

# Check logs
echo -e "${CYAN}📝 Log Files:${NC}"
if [ -d "$LOG_DIR" ]; then
    echo -e "   Location: ${CYAN}$LOG_DIR${NC}"
    echo ""
    
    for log in backend.log frontend.log ai-service.log; do
        if [ -f "$LOG_DIR/$log" ]; then
            size=$(ls -lh "$LOG_DIR/$log" | awk '{print $5}')
            modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$LOG_DIR/$log" 2>/dev/null || stat -c "%y" "$LOG_DIR/$log" 2>/dev/null | cut -d'.' -f1)
            echo -e "   ${GREEN}✓${NC} $log (${size}, modified: $modified)"
        else
            echo -e "   ${YELLOW}⚠${NC}  $log not found"
        fi
    done
else
    echo -e "   ${YELLOW}⚠${NC}  Log directory not found"
fi

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}║          📋 Quick Commands                            ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Start services:  ${GREEN}./start.sh${NC}"
echo -e "Stop services:   ${RED}./stop.sh${NC}"
echo -e "View logs:       ${YELLOW}tail -f logs/[backend|frontend|ai-service].log${NC}"
echo ""
