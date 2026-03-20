# Technical Interview Feature - Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup

#### Backend
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running
- [ ] Redis running (optional, for caching)
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file configured with:
  - [ ] `DATABASE_URL` or individual DB credentials
  - [ ] `JWT_SECRET`
  - [ ] `AI_SERVICE_URL=http://localhost:8000`

#### AI Service
- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] AI service dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with:
  - [ ] `LLM_ENDPOINT=http://localhost:11434/api/generate`
  - [ ] `LLM_MODEL=llama3`

#### Frontend
- [ ] Node.js 18+ installed
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file configured with:
  - [ ] `VITE_API_URL=http://localhost:3000`

#### Optional: LLM Setup (for advanced evaluation)
- [ ] Ollama installed (https://ollama.ai)
- [ ] Llama3 model downloaded (`ollama pull llama3`)
- [ ] Ollama service running (`ollama serve`)

---

## 🗄️ Database Setup

### Run Migrations
```bash
cd backend

# Core database setup (if not already done)
node src/scripts/initDb.js

# Technical interview tables
node src/scripts/addTechnicalInterviewTables.js
```

**Expected Output:**
- ✅ `technical_questions` table created
- ✅ `technical_interview_attempts` table created
- ✅ `technical_interview_responses` table created
- ✅ Jobs table columns added
- ✅ Applications table columns added
- ✅ Indexes created

### Seed Question Bank
```bash
node src/scripts/seedTechnicalQuestions.js
```

**Expected Output:**
- ✅ 25+ questions inserted
- ✅ Statistics shown (by topic and difficulty)

---

## 🧪 Testing

### 1. Health Checks

**Backend:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

**AI Service:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}

curl http://localhost:8000/ai/technical/health
# Expected: {"status":"ok","service":"technical-interview"}
```

**Ollama (optional):**
```bash
curl http://localhost:11434/api/tags
# Expected: List of models including llama3
```

### 2. Database Validation

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('technical_questions', 'technical_interview_attempts', 'technical_interview_responses');

-- Check question count
SELECT COUNT(*) as total, topic, difficulty 
FROM technical_questions 
GROUP BY topic, difficulty;

-- Expected: 25+ rows across various topics and difficulties
```

### 3. API Integration Tests

Run automated test suite:
```bash
cd backend

# Configure test credentials in .env first:
# TEST_CANDIDATE_EMAIL=test@example.com
# TEST_CANDIDATE_PASSWORD=password123
# TEST_JOB_ID=<uuid-of-test-job>

node test-technical-interview.js
```

**Tests Performed:**
1. ✅ Health checks (backend + AI service)
2. ✅ Authentication
3. ✅ AI evaluation endpoint
4. ✅ Start interview
5. ✅ Submit answer
6. ✅ Get status

### 4. Manual UI Testing

#### Recruiter Flow:
1. [ ] Login as recruiter
2. [ ] Create/edit a job
3. [ ] Navigate to technical interview config
4. [ ] Enable technical interview
5. [ ] Set duration (e.g., 30 minutes)
6. [ ] Set question count (e.g., 5)
7. [ ] Select topics (e.g., Data Structures, Algorithms)
8. [ ] Save configuration
9. [ ] Verify settings saved correctly

#### Candidate Flow:
1. [ ] Login as candidate
2. [ ] Apply to job with technical interview enabled
3. [ ] Navigate to technical interview
4. [ ] Click "Start Technical Interview"
5. [ ] Verify timer starts
6. [ ] Verify questions load
7. [ ] Test Text-to-Speech (AI reads question)
8. [ ] Test Speech-to-Text (speak answer - Chrome/Edge only)
9. [ ] Type answer manually
10. [ ] Submit answer
11. [ ] Verify evaluation results shown
12. [ ] Navigate to next question
13. [ ] Navigate to previous question
14. [ ] Use question navigator grid
15. [ ] Submit complete interview
16. [ ] Verify cannot edit after submission

#### Browser Compatibility:
- [ ] Chrome - Full functionality
- [ ] Edge - Full functionality
- [ ] Firefox - Text input only (no speech recognition)
- [ ] Safari - Limited speech recognition

---

## 🔍 Troubleshooting Checklist

### Issue: Speech Recognition Not Working

Check:
- [ ] Using Chrome or Edge browser
- [ ] Microphone permissions granted
- [ ] HTTPS in production (required for speech recognition)
- [ ] Check browser console for errors

**Fallback:** Use manual text input

### Issue: AI Evaluation Failing

Check:
- [ ] AI service running (`curl http://localhost:8000/health`)
- [ ] Ollama running (`curl http://localhost:11434/api/tags`)
- [ ] AI service logs for errors
- [ ] Network connectivity between backend and AI service

**Fallback:** System uses heuristic evaluation

### Issue: No Questions Available

Check:
- [ ] Question seed script ran successfully
- [ ] Database contains questions: `SELECT COUNT(*) FROM technical_questions;`
- [ ] Job has topics configured (or leave empty for all topics)

**Fix:** Run seed script: `node src/scripts/seedTechnicalQuestions.js`

### Issue: Interview Expires Immediately

Check:
- [ ] System time synchronized
- [ ] Job has `selection_lock_from` and `selection_lock_until` configured correctly
- [ ] Server timezone matches database timezone

### Issue: Tables Don't Exist

Check:
- [ ] Migration script ran successfully
- [ ] Check database logs for errors
- [ ] Verify database connection in backend

**Fix:** Run migration: `node src/scripts/addTechnicalInterviewTables.js`

---

## 📊 Performance Validation

### Response Time Benchmarks

**Expected Performance:**
- Health Check: < 100ms
- Start Interview: < 500ms
- Submit Answer (without AI): < 200ms
- Submit Answer (with AI): 3-10 seconds
- Get Status: < 200ms

### Load Testing (Optional)

```bash
# Install Apache Bench (if not installed)
# On Mac: brew install httpd

# Test health endpoint
ab -n 100 -c 10 http://localhost:3000/health

# Test with authentication (create auth token first)
ab -n 50 -c 5 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/technical/status?jobId=YOUR_JOB_ID
```

---

## 🔐 Security Validation

### Authentication & Authorization
- [ ] Cannot access interview without authentication
- [ ] Cannot access another candidate's interview
- [ ] Cannot modify answers after submission
- [ ] JWT tokens expire appropriately
- [ ] Cannot start interview for job you haven't applied to

### Input Validation
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (sanitized inputs)
- [ ] CSRF protection (if applicable)
- [ ] File upload validation (not applicable to this feature)

### Data Privacy
- [ ] Interview responses isolated per candidate
- [ ] No data leakage in API responses
- [ ] Sensitive data not logged
- [ ] Database credentials not exposed

---

## 📈 Monitoring Setup

### Logs to Monitor

**Backend:**
- API request logs
- Error logs
- Database query logs

**AI Service:**
- Evaluation request logs
- LLM API call logs
- Error logs

### Key Metrics

- [ ] Interview start rate
- [ ] Interview completion rate
- [ ] Average evaluation time
- [ ] AI service uptime
- [ ] Question distribution (ensure randomness)
- [ ] Score distribution (identify outliers)

### Alerts to Configure

- [ ] AI service down
- [ ] LLM API failures
- [ ] High evaluation latency (> 15 seconds)
- [ ] Database connection issues
- [ ] Spike in interview failures

---

## 📝 Documentation Verification

- [ ] README.md updated with technical interview info
- [ ] API documentation complete
- [ ] User guide available (docs/technical-interview.md)
- [ ] Quick start guide available
- [ ] Code comments added
- [ ] Database schema documented

---

## 🚀 Deployment Steps

### Development
1. [ ] Run setup script: `./setup-technical-interview.sh`
2. [ ] Start all services
3. [ ] Run test suite
4. [ ] Manual testing
5. [ ] Verify logs clean

### Staging
1. [ ] Deploy code to staging
2. [ ] Run database migrations
3. [ ] Seed questions
4. [ ] Run integration tests
5. [ ] Performance testing
6. [ ] Security audit
7. [ ] User acceptance testing

### Production
1. [ ] Backup database
2. [ ] Deploy code
3. [ ] Run migrations (with rollback plan)
4. [ ] Seed questions
5. [ ] Smoke tests
6. [ ] Monitor error rates
7. [ ] Monitor performance
8. [ ] Verify user flows

---

## 🎯 Success Criteria

### Functional
- [ ] Recruiters can enable/configure technical interviews
- [ ] Candidates can start interviews
- [ ] Speech recognition works (Chrome/Edge)
- [ ] Text input works (all browsers)
- [ ] TTS works for question reading
- [ ] Answers are evaluated correctly
- [ ] Scores are calculated and stored
- [ ] Interview can be resumed
- [ ] Timer works and auto-submits

### Performance
- [ ] Start interview < 500ms
- [ ] AI evaluation < 10 seconds
- [ ] UI responsive on mobile
- [ ] Handles 10+ concurrent interviews

### User Experience
- [ ] Clear instructions provided
- [ ] Error messages helpful
- [ ] Loading states shown
- [ ] Progress indicators accurate
- [ ] No browser console errors

### Security
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] No data leakage
- [ ] Input sanitized

---

## ✅ Final Sign-off

**Developer Review:**
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation complete
- [ ] No known bugs

**QA Review:**
- [ ] Manual testing complete
- [ ] Edge cases tested
- [ ] Browser compatibility verified
- [ ] Performance acceptable

**Security Review:**
- [ ] Authentication working
- [ ] Authorization working
- [ ] Input validation present
- [ ] No security vulnerabilities

**Product Review:**
- [ ] Features complete
- [ ] User experience good
- [ ] Documentation clear
- [ ] Ready for users

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes:** _______________________________________________
