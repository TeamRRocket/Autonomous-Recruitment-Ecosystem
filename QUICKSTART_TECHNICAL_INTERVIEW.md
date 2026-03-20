# Quick Start Guide - Technical Interview Feature

## 🚀 5-Minute Setup

### Prerequisites
- PostgreSQL running
- Node.js installed
- Python 3.8+ installed
- (Optional) Ollama for LLM evaluation

### Step 1: Run Setup Script
```bash
chmod +x setup-technical-interview.sh
./setup-technical-interview.sh
```

This will:
✅ Create database tables
✅ Seed 25+ technical questions
✅ Check dependencies

### Step 2: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Configure (Recruiter)

1. Login as recruiter
2. Navigate to a job
3. Configure technical interview:
   - Enable it
   - Set duration (e.g., 30 minutes)
   - Set question count (e.g., 5 questions)
   - Select topics (optional)
4. Save

### Step 4: Take Interview (Candidate)

1. Login as candidate
2. Apply to the job
3. Click "Start Technical Interview"
4. Grant microphone permissions (or use text input)
5. Answer questions:
   - Click "Start Recording" to speak
   - Or type answer manually
6. Submit interview

## 📊 Features Overview

### Voice Interview
- AI reads questions aloud
- Speak your answers
- Real-time transcription
- Works in Chrome/Edge

### AI Evaluation
- Evaluates on 3 dimensions:
  - Correctness
  - Depth
  - Clarity
- Instant feedback
- Score 0-10

### Smart Management
- Auto-save answers
- Question navigation
- Progress tracking
- Timer with auto-submit

## 🔧 Configuration Options

### Job-Level Settings
```javascript
{
  technical_enabled: true,
  technical_duration_minutes: 30,
  technical_question_count: 5,
  technical_topics: ["Data Structures", "Algorithms"]
}
```

### Environment Variables

**Backend (.env):**
```env
AI_SERVICE_URL=http://localhost:8000
```

**AI Service (.env):**
```env
LLM_ENDPOINT=http://localhost:11434/api/generate
LLM_MODEL=llama3
```

## 🎯 Quick Test

### Test Question
Navigate to: `http://localhost:3000/api/technical/start`

### Test Evaluation
```bash
curl -X POST http://localhost:8000/ai/technical/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is a binary search tree?",
    "answer": "A binary search tree is a data structure where left nodes are smaller and right nodes are larger.",
    "expectedConcepts": ["binary tree", "ordering"],
    "topic": "Data Structures"
  }'
```

## 📱 Browser Support

| Browser | Voice Input | Text Input | TTS |
|---------|-------------|------------|-----|
| Chrome  | ✅ Full     | ✅         | ✅  |
| Edge    | ✅ Full     | ✅         | ✅  |
| Firefox | ❌ No       | ✅         | ✅  |
| Safari  | ⚠️ Limited  | ✅         | ✅  |

**Recommendation:** Use Chrome or Edge for best experience.

## 🐛 Common Issues

### Issue: "Speech recognition not supported"
**Solution:** Use Chrome or Edge browser, or use manual text input

### Issue: "AI evaluation slow/failing"
**Solution:** 
1. Check AI service is running: `curl http://localhost:8000/health`
2. Check Ollama is running: `curl http://localhost:11434/api/tags`
3. System will fall back to heuristic evaluation if LLM unavailable

### Issue: "No questions available"
**Solution:** Run seed script: `node backend/src/scripts/seedTechnicalQuestions.js`

### Issue: "Interview expired immediately"
**Solution:** Check system time is correct and synchronized

## 📚 More Information

- **Full Documentation:** [docs/technical-interview.md](docs/technical-interview.md)
- **Implementation Summary:** [TECHNICAL_INTERVIEW_SUMMARY.md](TECHNICAL_INTERVIEW_SUMMARY.md)
- **API Reference:** See documentation for complete API specs

## 🆘 Need Help?

1. Check browser console for errors
2. Check server logs (backend and AI service)
3. Verify all services are running
4. Ensure database migrations completed
5. Review documentation

## ✨ Tips for Best Results

### For Candidates:
- Use a quiet environment
- Speak clearly and at moderate pace
- Use complete sentences
- Include technical terms
- Explain concepts thoroughly

### For Recruiters:
- Set realistic time limits
- Choose relevant topics for the role
- Review scores alongside other rounds
- Consider candidate's explanation depth

## 🎉 That's It!

You now have a fully functional AI-powered technical interview system!

**Happy Recruiting! 🚀**
