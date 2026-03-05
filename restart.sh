#!/bin/bash

# Quick restart script for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${CYAN}🔄 Restarting all services...${NC}"
echo ""

# Stop any existing processes
echo -e "${YELLOW}Stopping existing services...${NC}"
pkill -f "vite" 2>/dev/null || true
pkill -f "node src/index.js" 2>/dev/null || true
pkill -f "ai-service/main.py" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
sleep 2

# Clean up PID file
rm -f logs/services.pid
mkdir -p logs

# Kill processes on ports if any
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 1

echo -e "${GREEN}✓ Stopped all services${NC}"
echo ""

# Start backend
echo -e "${CYAN}Starting backend...${NC}"
cd "$SCRIPT_DIR/backend"
nohup npm start > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3

# Start frontend
echo -e "${CYAN}Starting frontend...${NC}"
cd "$SCRIPT_DIR/frontend"
nohup npm run dev > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

# Start AI service
echo -e "${CYAN}Starting AI service...${NC}"
cd "$SCRIPT_DIR/ai-service"
source .venv/bin/activate
export PYTHONWARNINGS="ignore"
nohup python main.py > "$SCRIPT_DIR/logs/ai-service.log" 2>&1 &
AI_PID=$!
echo -e "${GREEN}✓ AI service started (PID: $AI_PID)${NC}"
sleep 2

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ All services restarted successfully   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Services:${NC}"
echo -e "  Backend:    http://localhost:3000"
echo -e "  Frontend:   http://localhost:5173"
echo -e "  AI Service: http://localhost:8000"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo -e "  tail -f logs/backend.log"
echo -e "  tail -f logs/frontend.log"
echo -e "  tail -f logs/ai-service.log"
echo ""

# Verify services are running
echo -e "${CYAN}Verifying services...${NC}"
sleep 2

if lsof -i:3000 | grep -q LISTEN; then
    echo -e "${GREEN}✓ Backend is listening on port 3000${NC}"
else
    echo -e "${RED}✗ Backend not responding on port 3000${NC}"
fi

if lsof -i:5173 | grep -q LISTEN; then
    echo -e "${GREEN}✓ Frontend is listening on port 5173${NC}"
else
    echo -e "${RED}✗ Frontend not responding on port 5173${NC}"
fi

if lsof -i:8000 | grep -q LISTEN; then
    echo -e "${GREEN}✓ AI service is listening on port 8000${NC}"
else
    echo -e "${RED}✗ AI service not responding on port 8000${NC}"
fi

echo ""
