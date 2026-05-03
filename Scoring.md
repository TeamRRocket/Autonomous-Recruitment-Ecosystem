# Viva Examination Guide - Algorithms & Equations

## 1. Resume Scoring

**Overall Resume Score:** `(Skill × 0.5) + (Experience × 0.3) + (Education × 0.2)`

### Skill Matching
**File:** `ai-service/ai/matching/skill_matcher.py` 
```
Hard Skill Score = ((Exact × 1.0 + Related × 0.6) / Total Hard) × 85
Soft Bonus = (Soft Matches / Total Soft) × 15
Final = Hard Score + Soft Bonus
```

### Experience
**File:** `ai-service/ai/scoring/rule_scores.py` 
```
Base = min(100, (Years / 10) × 100)
Final = (Base × 0.7) + (Role Alignment × 100 × 0.3)
```

### Education
**File:** `ai-service/ai/scoring/rule_scores.py` 
```
Match required degree: 100
Common degree found: 60
No degree: 0
```

---

## 2. Overall Score

**File:** `backend/src/modules/resume/resumeRanking.service.js` 
```
Total Score = (Resume + Aptitude + DSA + Technical + Coding Avg) / Completed Rounds
```

**Strengths/Gaps:** Score ≥ 80 = Strength, Score < 50 = Gap

---

## 3. Interview Rounds

### Aptitude
**File:** `backend/src/modules/resume/resumeRanking.service.js` 
```
Score = (Correct / Total Questions) × 100
```

### DSA/Coding
**File:** `backend/src/modules/dsa/dsa.service.js` 
```
Problem Score = (Passed Tests / Total Tests) × 100
DSA Final = Average of all problem scores
```

### Technical Interview
**File:** `ai-service/ai/technical/evaluator.py` 
```
Overall = (Correctness + Depth + Clarity) / 3
Each dimension: 0-10 scale
```

---

## 4. Proctoring/Risk Detection

**File:** `ai-service/ai/proctoring/risk_evaluator.py` 

### Risk Score
```
Risk = (No Face × 8) + (Multiple Faces × 15) + (Looking Away × 3) + 
       (Tab Switch × 10) + (Window Blur × 4) + (Copy/Paste × 20) + 
       (Phone × 25)
Max: 100
```

### Risk Levels
```
0-39: Low
40-69: Medium
70-100: High
```

---

## 5. AI Role in Scoring & Evaluation

### Resume Scoring
- **Primary:** LLM (Claude sonet 3.5) extracts resume data and calculates scores
- **Fallback:** Rule-based algorithms if LLM fails or returns zeros
- **File:** `ai-service/ai/api/resume_routes.py` (115-156)

### Technical Interview
- **Primary:** LLM evaluates answers on Correctness, Depth, Clarity (0-10 each)
- **Fallback:** Heuristic based on answer length and keyword matching
- **File:** `ai-service/ai/technical/evaluator.py` (75-151)

### Proctoring/Risk
- **Primary:** LLM analyzes behavioral patterns and assigns risk score
- **Fallback:** Rule-based point system if LLM unavailable
- **File:** `ai-service/ai/proctoring/risk_evaluator.py` (74-133)

### Performance Summary
- **AI Only:** LLM generates comprehensive candidate performance overview
- **Input:** Resume summary + all round scores
- **Output:** 2-3 paragraphs for recruiter decision-making
- **File:** `ai-service/ai/api/performance_summary_helper.py` (11-48)

---

## 6. File Reference

| Function | File |
|----------|------|
| Skill Matching | `ai-service/ai/matching/skill_matcher.py` |
| Resume Scoring | `ai-service/ai/scoring/rule_scores.py` |
| Resume API | `ai-service/ai/api/resume_routes.py` |
| Overall Ranking | `backend/src/modules/resume/resumeRanking.service.js` |
| DSA Scoring | `backend/src/modules/dsa/dsa.service.js` |
| Aptitude Scoring | `backend/src/modules/aptitude/aptitude.service.js` |
| Technical Interview | `ai-service/ai/technical/evaluator.py` |
| Proctoring/Risk | `ai-service/ai/proctoring/risk_evaluator.py` |
| Performance Summary | `ai-service/ai/api/performance_summary_helper.py` |
| Selection | `backend/src/modules/job/selection.service.js` |

---

## 7. Viva Questions

### Scoring

**Resume Scoring:**
1. **What is the weight distribution for resume scoring and why?**
   - Skills: 50%, Experience: 30%, Education: 20%
   - Skills are most important as they directly match job requirements
   - Experience shows practical application, education shows foundational knowledge

2. **How does the skill matching algorithm differentiate between exact and related skills?**
   - Exact matches get 100% weight (1.0 multiplier)
   - Related skills (same family) get 60% weight (0.6 multiplier)
   - Example: "React" exact match vs "Vue" (related in frontend family)

3. **Explain the experience scoring formula and its components.**
   - Base = min(100, (Years / 10) × 100) - 10 years = 100%
   - Final = (Base × 0.7) + (Role Alignment × 100 × 0.3)
   - 70% weight to years, 30% to title matching

4. **How does the system handle missing or unstructured resume data?**
   - Falls back to text parsing using regex patterns
   - Infers years from raw text (e.g., "5+ years experience")
   - Searches for degree keywords in unstructured text

5. **What is the role of LLM vs rule-based scoring in resume evaluation?**
   - LLM (Ollama/Llama3) is primary: extracts data and calculates scores
   - Rule-based is fallback: used when LLM fails or returns zeros
   - Ensures system works even without AI availability

**Overall Scoring:**
1. **How is the total score calculated across multiple interview rounds?**
   - Total = (Resume + Aptitude + DSA + Technical + Coding Avg) / Completed Rounds
   - Average of all completed rounds
   - Resume is always counted (mandatory base)

2. **Why is resume score mandatory while other rounds are optional?**
   - Resume is the first screening criterion
   - Other rounds may not be taken by all candidates
   - Ensures fair comparison across different completion levels

3. **How are strengths and gaps determined from individual scores?**
   - Score ≥ 80: Added to Strengths list
   - Score < 50: Added to Gaps list
   - Used for AI-generated performance summary

4. **Explain the coding average calculation in DSA rounds.**
   - Coding Avg = (Sum of all problem scores) / Number of problems
   - Each problem score = (Passed Tests / Total Tests) × 100
   - DSA Final Score = Average of all problem scores

**Round-Specific Scoring:**
1. **How is the aptitude score computed from multiple-choice questions?**
   - Score = (Correct Answers / Total Questions) × 100
   - Each question has 4 options (A, B, C, D)
   - Calculated at submission or auto-expiration

2. **What is the difference between public and hidden test cases in DSA scoring?**
   - Public: Shown to candidate for testing (used in "run code")
   - Hidden: Used only for final scoring (prevents hardcoding)
   - Final score based on all test cases combined

3. **How does the technical interview scoring combine correctness, depth, and clarity?**
   - Overall = (Correctness + Depth + Clarity) / 3
   - Each dimension scored 0-10 by LLM
   - Correctness: factual accuracy, Depth: understanding, Clarity: explanation quality

4. **What happens when a candidate's answer is too short or too long in technical interviews?**
   - Short (<50 chars): Depth = 3.0, Clarity = 4.0 (penalty)
   - Long (>200 chars): Depth = 7.0, Clarity = 7.0 (bonus)
   - Fallback heuristic when LLM evaluation fails

---

### Matching

**Skill Matching:**
1. **What is skill normalization and why is it important?**
   - Converts skill variations to standard form (e.g., "js" → "javascript", "node" → "nodejs")
   - Ensures accurate matching despite different naming conventions
   - Uses predefined alias mapping dictionary

2. **How does the system identify related skills within the same family?**
   - Skills are grouped into families (javascript_ecosystem, python_ecosystem, databases, etc.)
   - If two skills belong to same family, they're considered related
   - Related skills get partial credit (60% weight) in matching

3. **Explain the difference between hard skills and soft skills in matching.**
   - Hard skills: Technical abilities (Python, React, SQL) - 85% of score
   - Soft skills: Interpersonal abilities (communication, leadership) - 15% of score
   - Hard skills are mandatory, soft skills are bonus

4. **How does the skill family classification work?**
   - Predefined families: javascript_ecosystem, python_ecosystem, databases, cloud, devops, frontend, backend, ml_ai, mobile, testing
   - Each family contains related skills
   - Used to identify partial matches when exact match not found

5. **What is the scoring formula for hard skills vs soft skills?**
   - Hard Score = ((Exact × 1.0 + Related × 0.6) / Total Hard) × 85
   - Soft Bonus = (Soft Matches / Total Soft) × 15
   - Final = Hard Score + Soft Bonus

**Resume-Job Matching:**
1. **How does role title alignment work in experience matching?**
   - Tokenizes job title and past role titles
   - Calculates matching tokens / total job title tokens
   - Example: "Senior Software Engineer" matches "Software Engineer" with high alignment

2. **What factors contribute to the overall resume-job match score?**
   - Skill match score (50% weight)
   - Experience relevance score (30% weight)
   - Education relevance score (20% weight)
   - Combined using weighted average

3. **How does the system handle partial skill matches?**
   - Exact matches: Full credit (100%)
   - Related skills (same family): Partial credit (60%)
   - Missing skills: No credit (0%)
   - Formula accounts for partial matches in final score

4. **Explain the fallback mechanism when structured data is unavailable.**
   - Falls back to raw text parsing using regex
   - Searches for skill keywords in resume text
   - Infers experience from text patterns (e.g., "5 years experience")
   - Ensures scoring works even with poor resume parsing

---

### Interview Rounds

**Aptitude Round:**
1. **How are questions selected for the aptitude round?**
   - Randomly selected from question bank based on difficulty (easy/medium/hard)
   - Number of questions configured per job (e.g., 10 questions)
   - Ensures different candidates get different question sets

2. **What happens when the aptitude round time expires?**
   - System auto-calculates score from submitted answers
   - Status changes to "expired" instead of "submitted"
   - Score is saved based on whatever answers were submitted

3. **How is the pipeline gating implemented between rounds?**
   - First round must be completed before unlocking next round
   - Configurable: APTITUDE first or DSA first
   - Database check ensures previous round status is "submitted" or "expired"

4. **Explain the auto-expiration mechanism for aptitude attempts.**
   - Redis TTL tracks time limit
   - When TTL expires, system auto-scores existing answers
   - Prevents candidates from extending time by refreshing

**DSA/Coding Round:**
1. **How does the Judge0 API integrate with the DSA scoring system?**
   - Judge0 executes C++ code in isolated environment
   - Returns status, stdout, stderr, time, memory usage
   - System compares output against expected test cases
   - Supports language ID 54 (GNU C++17)

2. **What is the difference between run code and submit in DSA rounds?**
   - Run code: Tests against public test cases only (for debugging)
   - Submit: Runs against all test cases (public + hidden) for final score
   - Submit locks the problem, preventing further changes

3. **How are test cases evaluated (compilation error, runtime error, wrong answer)?**
   - Compilation error: Code doesn't compile, status = "Compilation Error"
   - Runtime error: Code crashes during execution, status = "Runtime Error"
   - Wrong answer: Code runs but output doesn't match, status = "Wrong Answer"
   - Accepted: Output matches expected, status = "Accepted"

4. **Explain the auto-submit mechanism when time expires.**
   - Redis TTL expires, triggering auto-submit
   - Draft code from Redis is submitted as final solution
   - System runs all test cases and calculates final score
   - Prevents data loss when time runs out

5. **How does Redis manage the timing and state of DSA attempts?**
   - Redis stores status key with TTL for time limit
   - Draft code stored in Redis hash for auto-save
   - Redis is authoritative timer (more reliable than database)
   - When TTL expires, database status updated to "EXPIRED"

**Technical Interview:**
1. **How does the LLM evaluate technical answers?**
   - LLM receives question, answer, and expected concepts
   - Scores on three dimensions: Correctness, Depth, Clarity (0-10 each)
   - Provides constructive feedback (2-3 sentences)
   - Returns JSON with scores and feedback

2. **What are the three dimensions of technical interview scoring?**
   - Correctness: Factual accuracy of the answer
   - Depth: Depth of understanding demonstrated
   - Clarity: Quality and structure of explanation
   - Overall = Average of three dimensions

3. **Explain the fallback heuristic when LLM evaluation fails.**
   - Uses answer length as proxy for depth/clarity
   - Keyword matching for correctness (matches expected concepts)
   - Correctness = 3.0 + (matched_concepts / total_concepts) × 7.0
   - Ensures scoring works even without LLM

4. **How are expected concepts used in answer evaluation?**
   - Recruiter provides key concepts expected in answer
   - LLM checks if answer covers these concepts
   - Fallback counts keyword matches in answer text
   - Higher concept match = higher correctness score

**Proctoring/Risk Detection:**
1. **What behavioral events are monitored during proctoring?**
   - No face detected (candidate leaves camera)
   - Multiple faces detected (unauthorized person)
   - Looking away (checking notes/other screen)
   - Tab switches (accessing external resources)
   - Window blur (potential window switching)
   - Copy/paste attempts (copying answers)
   - Phone detected (using phone for assistance)

2. **How is the risk score calculated from different violations?**
   - Each violation has point value (No Face: 8, Multiple Faces: 15, Looking Away: 3, Tab Switch: 10, Window Blur: 4, Copy/Paste: 20, Phone: 25)
   - Risk = Sum of (Violation Count × Point Value)
   - Capped at 100 maximum

3. **What are the three risk levels and their thresholds?**
   - Low (0-39): Minor or no violations
   - Medium (40-69): Moderate concerns, needs attention
   - High (70-100): Serious violations, likely cheating

4. **Explain the difference between LLM-based and rule-based risk evaluation.**
   - LLM-based: Analyzes patterns, provides reasoning, more nuanced
   - Rule-based: Simple point system, deterministic, always available
   - LLM is primary, rule-based is fallback when LLM unavailable
   - Both use same scoring guidelines

5. **Why is phone detection given the highest point value?**
   - Phone use indicates clear intent to cheat
   - Cannot be accidental (unlike looking away)
   - Allows access to external resources undetected
   - Most serious violation of exam integrity

**General:**
1. **How does the system ensure fairness in scoring across different candidates?**
   - Same scoring algorithms applied to all candidates
   - Random question selection prevents advantage
   - Time limits enforced uniformly via Redis
   - Hidden test cases prevent hardcoding

2. **What happens when the AI service is unavailable during scoring?**
   - System falls back to rule-based algorithms
   - Resume scoring uses text parsing instead of LLM
   - Technical interview uses heuristic scoring
   - Risk evaluation uses point-based calculation
   - Ensures system continues functioning

3. **How are weights configured and can they be customized?**
   - Weights defined in `ai-service/ai/config.py`
   - Default: SKILL_WEIGHT = 0.5, EXPERIENCE_WEIGHT = 0.3, EDUCATION_WEIGHT = 0.2
   - Can be modified by changing config values
   - No UI for dynamic configuration (code change required)

4. **Explain the end-to-end flow from resume upload to final ranking.**
   - Candidate uploads resume → AI service extracts and scores resume
   - Candidate completes interview rounds (aptitude, DSA, technical)
   - Each round scored independently
   - Ranking service calculates total score (average of completed rounds)
   - Candidates sorted by total score, assigned ranks
   - Recruiter selects top N candidates for next round
   - AI generates performance summary for each candidate
