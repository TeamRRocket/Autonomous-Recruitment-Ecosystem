#!/bin/bash

# Technical Interview Setup Script
# This script sets up the technical interview feature

set -e

echo "================================================"
echo "Technical Interview Feature Setup"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
# Try to connect using the current user (macOS default) or postgres user
if psql -U $USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
elif psql -U postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    echo "Please start PostgreSQL with: brew services start postgresql@18"
    exit 1
fi
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Run database migrations
echo "Running database migrations..."
node src/scripts/addTechnicalInterviewTables.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database tables created${NC}"
else
    echo -e "${RED}❌ Database migration failed${NC}"
    exit 1
fi
echo ""

# Seed questions
echo "Seeding technical questions..."
node src/scripts/seedTechnicalQuestions.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Questions seeded${NC}"
else
    echo -e "${YELLOW}⚠ Question seeding skipped (may already exist)${NC}"
fi
echo ""

# Check AI service
cd ../ai-service

echo "Checking AI service dependencies..."
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✓ AI service dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
fi
echo ""

# Check if Ollama is running
echo "Checking Ollama (LLM service)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
    
    # Check if llama3 model is available
    if curl -s http://localhost:11434/api/tags | grep -q "llama3"; then
        echo -e "${GREEN}✓ llama3 model is available${NC}"
    else
        echo -e "${YELLOW}⚠ llama3 model not found${NC}"
        echo "  Download with: ollama pull llama3"
    fi
else
    echo -e "${YELLOW}⚠ Ollama is not running${NC}"
    echo "  The AI evaluation will use fallback heuristics"
    echo "  To enable LLM evaluation:"
    echo "  1. Install Ollama: https://ollama.ai"
    echo "  2. Run: ollama pull llama3"
    echo "  3. Start: ollama serve"
fi
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "2. Start the AI service:"
echo "   cd ai-service && python main.py"
echo ""
echo "3. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. (Optional) Enable LLM evaluation:"
echo "   - Install Ollama: https://ollama.ai"
echo "   - Run: ollama pull llama3"
echo "   - Ensure it's running on port 11434"
echo ""
echo "Documentation: docs/technical-interview.md"
echo ""
echo "================================================"
