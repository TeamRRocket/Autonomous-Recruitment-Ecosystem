# Technical Interview Feature

## Overview

The Technical Interview feature provides an AI-powered voice and text-based interview system for evaluating candidates on technical concepts. The system uses:

- **Speech Recognition**: Browser-based speech-to-text for capturing candidate responses
- **Text-to-Speech**: AI interviewer reads questions aloud
- **AI Evaluation**: LLM-based evaluation of answers on correctness, depth, and clarity
- **Real-time Feedback**: Instant scoring and constructive feedback

## System Architecture

```
┌─────────────────┐
│   Candidate     │
│   (Browser)     │
└────────┬────────┘
         │
         │ Speech Recognition (Web API)
         ↓
┌─────────────────┐
│  React Frontend │
│  - TTS/STT UI   │
│  - Answer Input │
└────────┬────────┘
         │
         │ HTTP/JSON
         ↓
┌─────────────────┐
│  Node.js API    │
│  - Session Mgmt │
│  - Question Svc │
└────────┬────────┘
         │
         │ HTTP
         ↓
┌─────────────────┐
│  Python AI Svc  │
│  - LLM Eval     │
│  - Scoring      │
└─────────────────┘
```

## Features

### 1. **Speech-to-Text Interview**
- Browser-based speech recognition (Chrome/Edge)
- Real-time transcription display
- Manual text input as fallback
- Continuous listening mode

### 2. **Text-to-Speech Questions**
- AI interviewer reads questions aloud
- Auto-speak on question load
- Manual replay option
- Toggle auto-speak on/off

### 3. **AI Evaluation**
- Evaluates answers on three dimensions:
  - **Correctness**: Factual accuracy (0-10)
  - **Depth**: Understanding level (0-10)
  - **Clarity**: Communication quality (0-10)
- Provides constructive feedback
- Real-time scoring after submission

### 4. **Interview Management**
- Timed interview sessions
- Question navigation (next/previous)
- Answer auto-save
- Progress tracking
- Session resume capability

### 5. **Question Bank**
- 25+ pre-loaded technical questions
- Multiple topics:
  - Data Structures
  - Algorithms
  - OOP
  - System Design
  - Web Development
  - Database
  - Operating Systems
- Three difficulty levels: easy, medium, hard

## Installation & Setup

### 1. Database Migration

Run the migration to create technical interview tables:

```bash
cd backend
node src/scripts/addTechnicalInterviewTables.js
```

### 2. Seed Questions

Populate the question bank:

```bash
node src/scripts/seedTechnicalQuestions.js
```

### 3. Environment Variables

Add to `backend/.env`:

```env
AI_SERVICE_URL=http://localhost:8000
```

Add to `ai-service/.env`:

```env
LLM_ENDPOINT=http://localhost:11434/api/generate
LLM_MODEL=llama3
```

### 4. Start Services

```bash
# Start backend
cd backend
npm install
npm start

# Start AI service
cd ai-service
pip install -r requirements.txt
python main.py

# Start frontend
cd frontend
npm install
npm run dev
```

## Usage

### For Recruiters

1. **Enable Technical Interview for a Job**:
   - Edit job settings
   - Enable technical interview
   - Configure:
     - Duration (default: 30 minutes)
     - Question count (default: 5)
     - Topics to cover
     - Difficulty level

2. **View Candidate Results**:
   - Check application dashboard
   - View `technical_score` (0-10 average)
   - Access detailed responses and feedback

### For Candidates

1. **Start Interview**:
   - Navigate to job application
   - Click "Start Technical Interview"
   - Grant microphone permissions (optional)

2. **Answer Questions**:
   - Listen to AI interviewer read the question
   - Click "Start Recording" to speak answer
   - OR type answer manually
   - Submit answer for evaluation
   - View instant feedback

3. **Navigate Questions**:
   - Use Next/Previous buttons
   - Or use Question Navigator grid
   - Switch between questions anytime

4. **Submit Interview**:
   - Answer all questions
   - Click "Submit Interview"
   - Cannot edit after submission

## API Endpoints

### Candidate Endpoints

```
POST   /api/technical/start
POST   /api/technical/submit-answer
POST   /api/technical/submit
GET    /api/technical/status
```

### AI Service Endpoints

```
POST   /ai/technical/evaluate
GET    /ai/technical/health
```

## Database Schema

### Tables

1. **technical_questions**
   - Question bank storage
   - Topics, difficulty, expected concepts

2. **technical_interview_attempts**
   - Interview sessions
   - Status tracking (IN_PROGRESS, SUBMITTED, EXPIRED)

3. **technical_interview_responses**
   - Individual answers
   - Scores and feedback

4. **jobs** (extended)
   - `technical_enabled`
   - `technical_duration_minutes`
   - `technical_question_count`
   - `technical_topics`

5. **applications** (extended)
   - `technical_score`

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Speech Recognition | ✅ | ✅ | ❌ | Limited |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| Manual Input | ✅ | ✅ | ✅ | ✅ |

**Note**: Speech recognition requires HTTPS in production. Use Chrome or Edge for best experience.

## AI Evaluation

The system uses a local LLM (Ollama) for evaluation by default. Evaluation prompt includes:

- Question text
- Expected key concepts
- Topic context
- Candidate answer

Fallback evaluation uses heuristics if LLM is unavailable:
- Answer length
- Keyword matching
- Concept coverage

## Configuration

### Job Configuration Example

```javascript
{
  "technical_enabled": true,
  "technical_duration_minutes": 30,
  "technical_question_count": 5,
  "technical_topics": ["Data Structures", "Algorithms", "System Design"]
}
```

### Question Selection Logic

Questions are randomly selected based on:
1. Configured topics (or all if empty)
2. Job difficulty level
3. Requested count

## Customization

### Adding New Questions

```javascript
// Run in PostgreSQL or via Node.js
INSERT INTO technical_questions (
  question_text,
  topic,
  difficulty,
  expected_concepts,
  time_limit_seconds
) VALUES (
  'Your question here?',
  'System Design',
  'medium',
  ARRAY['concept1', 'concept2'],
  300
);
```

### Modifying Evaluation Criteria

Edit [ai-service/ai/technical/evaluator.py](../ai-service/ai/technical/evaluator.py):

```python
# Adjust scoring weights
score = (correctness * 0.4) + (depth * 0.4) + (clarity * 0.2)
```

## Troubleshooting

### Speech Recognition Not Working

1. Check browser compatibility (Chrome/Edge)
2. Ensure HTTPS (required in production)
3. Grant microphone permissions
4. Check browser console for errors
5. Use manual text input as fallback

### AI Evaluation Failing

1. Check AI service is running (`http://localhost:8000/health`)
2. Verify Ollama is running (`ollama list`)
3. Check logs: `ai-service/logs/`
4. System falls back to heuristic evaluation

### Time Expired Issues

- Interview auto-submits when timer reaches 0
- Ensure server time is synchronized
- Check `selection_lock_from` and `selection_lock_until` in jobs table

## Performance

- Average response time: < 5 seconds (with LLM)
- Concurrent interviews: Limited by LLM capacity
- Question loading: Instant (cached in memory)
- Speech recognition: Real-time browser processing

## Security

- JWT authentication required
- Candidate can only access their own attempts
- No replay attacks (unique session IDs)
- Answer tampering prevented (server-side validation)

## Future Enhancements

- [ ] Video recording integration
- [ ] Multi-language support
- [ ] Custom question sets per job
- [ ] Recruiter review interface
- [ ] Advanced proctoring features
- [ ] Follow-up question generation
- [ ] Comparative analytics dashboard

## Support

For issues or questions:
- Check browser console for errors
- Review server logs
- Ensure all services are running
- Verify database migrations completed
