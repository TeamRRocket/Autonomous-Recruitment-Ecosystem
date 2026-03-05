#!/bin/bash

# HireFlow - Start All Services
# This script starts backend, frontend, and ai-service concurrently

set -e

# Ensure we use Homebrew's Node 20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Log file location
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# PID file to track running processes
PID_FILE="$LOG_DIR/services.pid"

echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}║          🚀 HireFlow - Starting All Services          ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}⚠️  Shutting down all services...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        while IFS= read -r pid; do
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}Stopping process $pid${NC}"
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Kill any remaining node/python processes from our services
    pkill -f "vite" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "ai-service/main.py" 2>/dev/null || true
    
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}✗ Python 3 is not installed. Please install Python 3.9+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check if .env files exist
echo -e "${BLUE}📋 Checking configuration files...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Using defaults...${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found. Using defaults...${NC}"
fi

if [ ! -f "ai-service/.env" ]; then
    echo -e "${YELLOW}⚠️  ai-service/.env not found. Using defaults...${NC}"
fi

echo ""

# Function to start backend
start_backend() {
    echo -e "${MAGENTA}[BACKEND]${NC} Starting backend service..."
    cd "$SCRIPT_DIR/backend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[BACKEND]${NC} Installing dependencies..."
        npm install
    fi
    
    # Start backend with nodemon or node
    if command_exists nodemon; then
        npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    else
        npm start > "$LOG_DIR/backend.log" 2>&1 &
    fi
    
    BACKEND_PID=$!
    echo "$BACKEND_PID" >> "$PID_FILE"
    echo -e "${GREEN}[BACKEND]${NC} Started (PID: $BACKEND_PID)"
    echo -e "${GREEN}[BACKEND]${NC} Running on http://localhost:3000"
    echo -e "${GREEN}[BACKEND]${NC} Logs: $LOG_DIR/backend.log"
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}[FRONTEND]${NC} Starting frontend service..."
    cd "$SCRIPT_DIR/frontend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[FRONTEND]${NC} Installing dependencies..."
        npm install
    fi
    
    # Start frontend with vite
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" >> "$PID_FILE"
    echo -e "${GREEN}[FRONTEND]${NC} Started (PID: $FRONTEND_PID)"
    echo -e "${GREEN}[FRONTEND]${NC} Running on http://localhost:5173 (or similar)"
    echo -e "${GREEN}[FRONTEND]${NC} Logs: $LOG_DIR/frontend.log"
}

# Function to start AI service
start_ai_service() {
    echo -e "${CYAN}[AI-SERVICE]${NC} Starting AI service..."
    cd "$SCRIPT_DIR/ai-service"
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}[AI-SERVICE]${NC} Creating virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment and start
    source .venv/bin/activate
    
    # Check if dependencies are installed
    if ! python -c "import fastapi" 2>/dev/null; then
        echo -e "${YELLOW}[AI-SERVICE]${NC} Installing dependencies..."
        pip install -r requirements.txt > "$LOG_DIR/ai-install.log" 2>&1
    fi
    
    # Start AI service with warning suppression
    export PYTHONWARNINGS="ignore"
    python main.py > "$LOG_DIR/ai-service.log" 2>&1 &
    AI_PID=$!
    echo "$AI_PID" >> "$PID_FILE"
    echo -e "${GREEN}[AI-SERVICE]${NC} Started (PID: $AI_PID)"
    echo -e "${GREEN}[AI-SERVICE]${NC} Running on http://localhost:8000"
    echo -e "${GREEN}[AI-SERVICE]${NC} Logs: $LOG_DIR/ai-service.log"
}

# Clear old PID file
rm -f "$PID_FILE"

# Start all services
echo -e "${CYAN}🚀 Starting services...${NC}"
echo ""

start_backend
sleep 2

start_frontend
sleep 2

start_ai_service
sleep 2

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}║          ✅ All Services Started Successfully          ║${NC}"
echo -e "${CYAN}║                                                       ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📝 Service URLs:${NC}"
echo -e "   ${MAGENTA}Backend:${NC}     http://localhost:3000"
echo -e "   ${BLUE}Frontend:${NC}    http://localhost:5173 (check logs for actual port)"
echo -e "   ${CYAN}AI Service:${NC}  http://localhost:8000"
echo ""
echo -e "${GREEN}📊 Logs:${NC}"
echo -e "   Backend:     tail -f $LOG_DIR/backend.log"
echo -e "   Frontend:    tail -f $LOG_DIR/frontend.log"
echo -e "   AI Service:  tail -f $LOG_DIR/ai-service.log"
echo ""
echo -e "${GREEN}📋 Health Checks:${NC}"
echo -e "   Backend:     curl http://localhost:3000/api/health"
echo -e "   AI Service:  curl http://localhost:8000/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Monitor services
while true; do
    sleep 5
    
    # Check if all services are still running
    if [ -f "$PID_FILE" ]; then
        all_running=true
        while IFS= read -r pid; do
            if ! ps -p "$pid" > /dev/null 2>&1; then
                all_running=false
                echo -e "${RED}⚠️  Service with PID $pid has stopped${NC}"
            fi
        done < "$PID_FILE"
        
        if [ "$all_running" = false ]; then
            echo -e "${RED}⚠️  Some services have stopped. Check logs for details.${NC}"
            echo -e "${YELLOW}Press Ctrl+C to stop remaining services${NC}"
        fi
    fi
done
