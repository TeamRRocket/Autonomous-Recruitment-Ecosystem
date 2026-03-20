# ==============================================================================
# AUTONOMOUS RECRUITMENT ECOSYSTEM - ENVIRONMENT CONFIGURATION
# ==============================================================================
# This file documents all environment variables used across the entire project.
# Copy the relevant sections to the appropriate service .env files.
#
# Project Structure:
#   - backend/.env      → Backend API configuration
#   - ai-service/.env   → AI/ML service configuration
#   - frontend/.env     → React frontend configuration
# ==============================================================================

# ==============================================================================
# BACKEND SERVICE (backend/.env)
# ==============================================================================

# -----------------------------------------------------------------------------
# Server Configuration
# -----------------------------------------------------------------------------
PORT=3000
NODE_ENV=development

# -----------------------------------------------------------------------------
# Database Configuration (PostgreSQL)
# -----------------------------------------------------------------------------
DB_USER=chintankasundra
DB_HOST=localhost
DB_NAME=hireflow
DB_PASSWORD=
DB_PORT=5432

# Alternative: Use DATABASE_URL instead
# DATABASE_URL=postgresql://chintankasundra@localhost:5432/hireflow

# -----------------------------------------------------------------------------
# Authentication & Security
# -----------------------------------------------------------------------------
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# -----------------------------------------------------------------------------
# Email Service (Gmail SMTP)
# -----------------------------------------------------------------------------
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="HireFlow <your-email@gmail.com>"

# -----------------------------------------------------------------------------
# Service URLs
# -----------------------------------------------------------------------------
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5174
AI_SERVICE_URL=http://localhost:8000

# -----------------------------------------------------------------------------
# Cache (Redis) - Optional
# -----------------------------------------------------------------------------
REDIS_URL=disabled
# REDIS_URL=redis://localhost:6379

# ==============================================================================
# AI SERVICE (ai-service/.env)
# ==============================================================================

# -----------------------------------------------------------------------------
# LLM Configuration (Technical Interview Evaluation)
# -----------------------------------------------------------------------------
# Option 1: Ollama Local LLM (Recommended for development)
LLM_ENDPOINT=http://localhost:11434/api/generate
LLM_MODEL=llama3

# Option 2: OpenRouter API (for production)
# LLM_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
# LLM_MODEL=anthropic/claude-3.5-sonnet
# OPENROUTER_API_KEY=your-openrouter-api-key

# -----------------------------------------------------------------------------
# Legacy Resume Scoring Configuration
# -----------------------------------------------------------------------------
USE_LOCAL_MODEL=true
LOCAL_MODEL=mistral
OLLAMA_URL=http://localhost:11434/api/chat
OPENROUTER_API_KEY=your-openrouter-api-key

# -----------------------------------------------------------------------------
# Service Configuration
# -----------------------------------------------------------------------------
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

# ==============================================================================
# FRONTEND SERVICE (frontend/.env)
# ==============================================================================

# -----------------------------------------------------------------------------
# API Configuration
# -----------------------------------------------------------------------------
VITE_APP_API_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# Google OAuth
# -----------------------------------------------------------------------------
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# ==============================================================================
# OPTIONAL SERVICES
# ==============================================================================

# -----------------------------------------------------------------------------
# Ollama (Local LLM) - Install separately
# -----------------------------------------------------------------------------
# Installation: brew install ollama
# Start: ollama serve
# Download model: ollama pull llama3
# Default endpoint: http://localhost:11434

# -----------------------------------------------------------------------------
# Judge0 (Code Execution) - For coding rounds
# -----------------------------------------------------------------------------
# JUDGE0_URL=http://localhost:2358
# JUDGE0_API_KEY=your-api-key

# ==============================================================================
# ENVIRONMENT-SPECIFIC EXAMPLES
# ==============================================================================

# DEVELOPMENT (.env.development)
# - Use local Ollama for LLM
# - Use local PostgreSQL
# - Disable Redis
# - Use localhost URLs

# STAGING (.env.staging)
# - Use remote OpenRouter API
# - Use staging database
# - Enable Redis
# - Use staging URLs

# PRODUCTION (.env.production)
# - Use production OpenRouter API
# - Use production database
# - Enable Redis with authentication
# - Use production URLs with HTTPS
# - Strong JWT secrets
# - Secure email configuration
# - Enable rate limiting

# ==============================================================================
# SECURITY NOTES
# ==============================================================================
# 1. Never commit .env files to git
# 2. Use strong, unique values for JWT_SECRET
# 3. Use app-specific passwords for email
# 4. Keep API keys secure and rotate them regularly
# 5. Use different credentials for dev/staging/prod
# 6. Enable HTTPS in production
# 7. Set NODE_ENV=production in production

# ==============================================================================
# QUICK SETUP
# ==============================================================================
# 1. Copy this file's sections to create individual .env files:
#    cp ENV_CONFIG.md backend/.env
#    cp ENV_CONFIG.md ai-service/.env
#    cp ENV_CONFIG.md frontend/.env
#
# 2. Edit each .env file to keep only the relevant section
#
# 3. Replace placeholder values with your actual credentials
#
# 4. Start services:
#    cd backend && npm start
#    cd ai-service && python main.py
#    cd frontend && npm run dev
