# Environment Configuration Guide

## Overview

This project uses **3 separate `.env` files** for the three main services:

```
Autonomous-Recruitment-Ecosystem/
├── backend/.env          ← Backend API (Node.js/Express)
├── ai-service/.env       ← AI/ML Service (Python/FastAPI)
└── frontend/.env         ← Frontend (React/Vite)
```

## Why Separate Files?

Each service runs independently and needs different configuration:
- **Backend**: Database, JWT, Email, etc.
- **AI Service**: LLM endpoints, model settings
- **Frontend**: API URLs, public keys only

## Quick Setup

### 1. Copy Example Files

```bash
# Backend
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Edit Each File

Replace placeholder values with your actual credentials.

### 3. Important Values to Change

**Backend (.env):**
- `DB_USER` → Your PostgreSQL username
- `DB_PASSWORD` → Your PostgreSQL password (if any)
- `JWT_SECRET` → A strong random string
- `EMAIL_USER` → Your Gmail address
- `EMAIL_PASS` → Gmail app-specific password

**AI Service (.env):**
- `OPENROUTER_API_KEY` → (Optional) If using OpenRouter API
- Keep defaults for local Ollama development

**Frontend (.env):**
- `VITE_GOOGLE_CLIENT_ID` → Your Google OAuth client ID
- Keep defaults for local development

## Current Configuration

### Your Active Settings:

**Backend:**
- Port: 3000
- Database: hireflow (user: chintankasundra)
- AI Service: http://localhost:8000 ✅
- Frontend: http://localhost:5174

**AI Service:**
- Port: 8000
- LLM: Ollama/llama3 (local)
- Fallback: Heuristic evaluation

**Frontend:**
- API: http://localhost:3000
- Google OAuth: Configured ✅

## Complete Documentation

See [ENV_CONFIG.md](ENV_CONFIG.md) for:
- All available environment variables
- Detailed explanations
- Production configuration examples
- Security best practices

## Verification

Check if all services can start:

```bash
# Backend
cd backend && npm start

# AI Service  
cd ai-service && source .venv/bin/activate && python main.py

# Frontend
cd frontend && npm run dev
```

## Troubleshooting

### "Cannot connect to database"
→ Check `backend/.env` DB credentials match your PostgreSQL setup

### "AI Service not responding"
→ Verify AI service is running on port 8000

### "OAuth error"
→ Check Google Client ID matches in both `backend/.env` and `frontend/.env`

### "Technical interview evaluation failing"
→ (Optional) Install Ollama: `brew install ollama && ollama pull llama3`
→ System will use fallback evaluation if Ollama not available

## Security Notes

⚠️ **Never commit `.env` files to git!**
- `.env` files are in `.gitignore`
- Only commit `.env.example` files
- Use different values for dev/staging/prod
- Rotate secrets regularly

## Need Help?

- Full environment reference: [ENV_CONFIG.md](ENV_CONFIG.md)
- Backend setup: [docs/startup.md](docs/startup.md)
- Technical interview: [docs/technical-interview.md](docs/technical-interview.md)
