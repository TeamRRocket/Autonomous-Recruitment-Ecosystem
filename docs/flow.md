# Workflow Documentation

This document describes the complete end-to-end workflows in the Autonomous Recruitment Ecosystem, covering both Candidate and Recruiter journeys.

## Table of Contents
- [System Architecture](#system-architecture)
- [User Onboarding Flows](#user-onboarding-flows)
- [Recruiter Workflow](#recruiter-workflow)
- [Candidate Workflow](#candidate-workflow)
- [Assessment Pipeline Flow](#assessment-pipeline-flow)
- [AI-Powered Features Flow](#ai-powered-features-flow)
- [Data Flow Architecture](#data-flow-architecture)

---

## System Architecture

### Technology Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- TailwindCSS for styling
- Context API for state management
- Axios for API calls
- Monaco Editor for code editing
- WebSocket for real-time proctoring

**Backend:**
- Node.js with Express
- PostgreSQL database
- Redis for caching and session management
- JWT authentication
- WebSocket server for proctoring
- File upload handling (Multer)
- Judge0 CE for code execution

**AI Service:**
- Python FastAPI
- OpenRouter API (Claude 3.5 Sonnet)
- OpenCV for face detection
- YOLOv8 for object detection
- Custom NLP for resume parsing
- Hybrid matching algorithm (rule-based + LLM)

**Services:**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │◄────►│   Backend   │◄────►│ AI Service  │
│  (React)    │      │  (Node.js)  │      │  (FastAPI)  │
│  Port 5173  │      │  Port 3000  │      │  Port 8000  │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
                ┌────▼────┐   ┌───▼────┐
                │PostgreSQL│   │ Redis  │
                │  (DB)    │   │(Cache) │
                └──────────┘   └────────┘
```

---

## User Onboarding Flows

### 1. Candidate Registration & Onboarding

```
┌──────────────┐
│ Visit /signup│
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Select Role:        │
│ ☑ Candidate         │
│ ☐ Recruiter         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Google OAuth Login  │
│ (or Email/Password) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Backend creates:    │
│ - User record       │
│ - Auth token        │
│ - Sets role         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Redirect:           │
│ /set-password       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User sets password  │
│ - Min 8 chars       │
│ - Uppercase/special │
│ - Number required   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Auto logout         │
│ Redirect: /login    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Login with new      │
│ credentials         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Check profile:      │
│ completed = false   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────┐
│ Redirect:               │
│ /onboarding/candidate   │
└──────┬──────────────────┘
       │
       ▼
┌────────────────────────────┐
│ STEP 1: Basic Info         │
│ - Full Name                │
│ - Years of Experience      │
└──────┬─────────────────────┘
       │ [Next]
       ▼
┌────────────────────────────┐
│ STEP 2: Experience & Skills│
│ - Primary Skills (tags)    │
│ - Secondary Skills (tags)  │
└──────┬─────────────────────┘
       │ [Next]
       ▼
┌────────────────────────────┐
│ STEP 3: Preferences        │
│ - Preferred Roles          │
│ - Preferred Locations      │
└──────┬─────────────────────┘
       │ [Complete]
       ▼
┌─────────────────────┐
│ Backend creates:    │
│ - candidate_profile │
│ - Sets completed=true│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Redirect:           │
│ /dashboard          │
└─────────────────────┘
```

### 2. Recruiter Registration & Onboarding

```
┌──────────────┐
│ Visit /signup│
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Select Role:        │
│ ☐ Candidate         │
│ ☑ Recruiter         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Google OAuth Login  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Backend creates:    │
│ - User record       │
│ - Role: RECRUITER   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ /set-password       │
│ Set new password    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Login again         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────┐
│ Redirect:               │
│ /onboarding/recruiter   │
└──────┬──────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Simple Form:               │
│ - Full Name                │
│ [Complete Setup]           │
└──────┬─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Backend creates:    │
│ - recruiter_profile │
│ - Sets completed=true│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Redirect:           │
│ /dashboard          │
└─────────────────────┘
```

---

## Recruiter Workflow

### 1. Job Creation Flow (Wizard Approach)

```
┌──────────────────┐
│ /dashboard       │
│ [Post New Job]   │
└────────┬─────────┘
         │
         ▼
┌───────────────────────────┐
│ /jobs/new                 │
│ HireFlow Architect Wizard │
└────────┬──────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ STEP 1: Job Description          │
│ ─────────────────────────────────│
│ - Job Title*                     │
│ - Location                       │
│ - Job Type (dropdown)            │
│ - Experience Level               │
│ - Degree Requirements            │
│ - Required Skills (tags)         │
│ - Job Description (textarea)     │
│ - Responsibilities               │
│ - Preferred Qualifications       │
│                                  │
│ [Save & Next]                    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend: POST /api/jobs          │
│ Creates job with status: DRAFT   │
│ Returns: job_id                  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ STEP 2: Select Rounds            │
│ ─────────────────────────────────│
│ Available Rounds:                │
│ ☑ Aptitude Round                 │
│ ☑ DSA Round                      │
│ ☐ Coding Round                   │
│                                  │
│ Pipeline Order:                  │
│ ⚪ Aptitude First                │
│ ⚫ DSA First                     │
│                                  │
│ [Back] [Save & Next]             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend: POST /api/rounds        │
│ Creates round configs (draft)    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ STEP 3: Configure Rounds         │
│ ─────────────────────────────────│
│ APTITUDE CONFIG:                 │
│ - Difficulty: [Easy/Med/Hard]    │
│ - Duration: [30] minutes         │
│ - Questions: [20]                │
│                                  │
│ DSA CONFIG:                      │
│ - Number of Problems: [3]        │
│ - Time Limit: [60] minutes       │
│ - Select Problems:               │
│   [Problem Browser/Selector]     │
│   - Problem 1: Two Sum (Easy)    │
│   - Problem 2: Valid BST (Med)   │
│   - Problem 3: Graph Path (Hard) │
│                                  │
│ [Back] [Save & Next]             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend: PATCH /api/jobs/:id     │
│ Updates aptitude config          │
│ Updates pipeline_first_round     │
│                                  │
│ POST /api/dsa/config             │
│ Creates DSA config with problems │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ STEP 4: Review & Publish         │
│ ─────────────────────────────────│
│ JOB SUMMARY:                     │
│ ✓ Software Engineer              │
│ ✓ San Francisco / Remote         │
│ ✓ Full-time                      │
│                                  │
│ ASSESSMENT PIPELINE:             │
│ 1️⃣  DSA Round (60 min, 3 probs)  │
│ 2️⃣  Aptitude (30 min, 20 Q)      │
│                                  │
│ [Save as Draft] [Publish Job]    │
└────────┬─────────────────────────┘
         │
         │ [Publish]
         ▼
┌──────────────────────────────────┐
│ Backend: PATCH /api/jobs/:id     │
│ Updates status: PUBLISHED        │
│ Publishes DSA config             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Redirect: /dashboard             │
│ Job is now visible to candidates │
└──────────────────────────────────┘
```

### 2. Application Review Flow

```
┌──────────────────┐
│ /applications    │
│ (Recruiter view) │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ GET /api/applications          │
│ Filter by recruiter's jobs     │
│ Returns applications with:     │
│ - Candidate info               │
│ - Job info                     │
│ - Resume file path             │
│ - Resume score (AI generated)  │
│ - Status                       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Display Applications Table:    │
│                                │
│ Name    | Job      | Score     │
│ ────────┼──────────┼──────────│
│ John D  | SWE      | 85/100   │
│ Jane S  | DevOps   | 92/100   │
│ Mike P  | Frontend | 78/100   │
│                                │
│ Actions: [View] [Shortlist]   │
└────────┬───────────────────────┘
         │
         │ [Shortlist clicked]
         ▼
┌────────────────────────────────┐
│ PATCH /api/applications/:id    │
│ {                              │
│   "status": "SHORTLISTED",     │
│   "stage": "shortlisted"       │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Application updated            │
│ Candidate can now see          │
│ "Shortlisted" status           │
└────────────────────────────────┘
```

### 3. Candidate Ranking & Selection Flow

```
┌──────────────────┐
│ /recruiter/scores│
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ Select Job from Dropdown       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ GET /api/recruiter/candidates  │
│ Returns all applicants with:   │
│ - Resume score                 │
│ - Aptitude score               │
│ - DSA score                    │
│ - Coding score                 │
│ - Current rank (if ranked)     │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Display Scores Table           │
│                                │
│ Rank | Name | Res | Apt | DSA │
│ ─────┼──────┼─────┼─────┼─────│
│  -   | John | 85  | N/A | N/A │
│  -   | Jane | 92  | 88  | 95  │
│  -   | Mike | 78  | N/A | N/A │
│                                │
│ [Rank Candidates] Button       │
└────────┬───────────────────────┘
         │
         │ [Rank Candidates]
         ▼
┌────────────────────────────────┐
│ POST /api/recruiter/rank       │
│ { "jobId": "..." }             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend Ranking Algorithm:     │
│                                │
│ 1. Collect all scores          │
│ 2. Calculate weighted score:   │
│    - Resume: 30%               │
│    - Aptitude: 25%             │
│    - DSA: 25%                  │
│    - Coding: 20%               │
│ 3. Normalize missing scores    │
│ 4. Sort by total score DESC    │
│ 5. Assign rank numbers         │
│ 6. UPDATE applications         │
│    SET rank = calculated_rank  │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend refreshes table       │
│                                │
│ Rank | Name | Res | Apt | DSA │
│ ─────┼──────┼─────┼─────┼─────│
│  1   | Jane | 92  | 88  | 95  │
│  2   | John | 85  | -   | -   │
│  3   | Mike | 78  | -   | -   │
│                                │
│ [Select Top Candidates] Button │
└────────┬───────────────────────┘
         │
         │ [Select Top Candidates]
         ▼
┌────────────────────────────────┐
│ MODAL: Select Configuration    │
│ ────────────────────────────── │
│ Top N: [2]                     │
│ Next Round: [APTITUDE ▼]       │
│ Interview Window:              │
│   Start: [2026-02-25 09:00]    │
│   End:   [2026-02-25 18:00]    │
│                                │
│ Selected Candidates:           │
│ 1. Jane Smith (Score: 91.7)    │
│ 2. John Doe (Score: 85)        │
│                                │
│ [Cancel] [Send Selection]      │
└────────┬───────────────────────┘
         │
         │ [Send Selection]
         ▼
┌────────────────────────────────┐
│ POST /api/recruiter/select     │
│ {                              │
│   "jobId": "...",              │
│   "topN": 2,                   │
│   "nextRound": "APTITUDE",     │
│   "lockFrom": "2026-02-25T09", │
│   "lockUntil": "2026-02-25T18" │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend Selection Logic:       │
│                                │
│ 1. Get top N ranked candidates │
│ 2. UPDATE applications:        │
│    - status = SHORTLISTED      │
│    - stage = shortlisted       │
│    - next_round = APTITUDE     │
│ 3. DELETE non-selected apps    │
│ 4. UPDATE jobs:                │
│    - selection_lock_from       │
│    - selection_lock_until      │
│ 5. Send automated emails       │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Email Service:                 │
│ ────────────────────────────── │
│ TO: Selected Candidates        │
│ SUBJECT: Interview Invitation  │
│ BODY:                          │
│ - Congratulations message      │
│ - Next round: APTITUDE         │
│ - Interview window details     │
│ - Login instructions           │
│                                │
│ TO: Rejected Candidates        │
│ SUBJECT: Application Update    │
│ BODY: Thank you message        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Success notification           │
│ "Selection emails sent to 2    │
│  candidates"                   │
└────────────────────────────────┘
```

---

## Candidate Workflow

### 1. Job Discovery & Application Flow

```
┌──────────────┐
│ /dashboard   │
│ or /jobs     │
└──────┬───────┘
       │
       ▼
┌───────────────────────────────┐
│ GET /api/jobs?status=PUBLISHED│
│ Returns published jobs         │
└──────┬────────────────────────┘
       │
       ▼
┌───────────────────────────────┐
│ Browse Jobs Page              │
│ - Search bar                  │
│ - Filters (location, exp, etc)│
│ - Job cards                   │
└──────┬────────────────────────┘
       │
       │ [Click job card]
       ▼
┌───────────────────────────────┐
│ /jobs/:id                     │
│ GET /api/jobs/:id             │
└──────┬────────────────────────┘
       │
       ▼
┌───────────────────────────────┐
│ Job Details Page              │
│ - Full description            │
│ - Requirements                │
│ - Apply section:              │
│   [Upload Resume]             │
│   [Apply] button              │
└──────┬────────────────────────┘
       │
       │ [Upload PDF resume]
       ▼
┌───────────────────────────────┐
│ Frontend validates:           │
│ - File type = PDF             │
│ - File size < 10MB            │
└──────┬────────────────────────┘
       │
       │ [Apply clicked]
       ▼
┌───────────────────────────────────┐
│ POST /api/applications            │
│ Content-Type: multipart/form-data │
│ - jobId                           │
│ - resumeFile (PDF)                │
└──────┬────────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: Application Service   │
│                                │
│ 1. Get candidate_id from user  │
│ 2. Check if already applied    │
│ 3. Verify job is PUBLISHED     │
│ 4. Save resume to:             │
│    uploads/resumes/            │
│ 5. INSERT INTO applications:   │
│    - candidate_id              │
│    - job_id                    │
│    - resume_file_path          │
│    - status: PENDING           │
│    - stage: applied            │
│ 6. Trigger async resume        │
│    processing                  │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Resume Processing Pipeline     │
│ (Background async job)         │
└────────┬───────────────────────┘
         │
         ▼
       [See Resume Processing Flow]
         │
         ▼
┌────────────────────────────────┐
│ Success Response               │
│ "Application submitted!"       │
│ Redirect: /applications        │
└────────────────────────────────┘
```

### 2. Resume Processing & Scoring Flow

```
┌─────────────────────────────┐
│ Application Created         │
│ Trigger: processApplication │
│         Resume              │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: Load resume file      │
│ Read: uploads/resumes/xxx.pdf  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Convert PDF to Base64          │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ POST to AI Service:            │
│ http://localhost:8000/         │
│       ai/resume/score          │
│                                │
│ Payload:                       │
│ {                              │
│   "job_description": "...",    │
│   "required_skills": [...],    │
│   "resume_file_base64": "...", │
│   "resume_filename": "..."     │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ AI Service Processing Pipeline:    │
│                                    │
│ STEP 1: PDF Parsing                │
│ ───────────────────────────────────│
│ - Decode base64                    │
│ - Extract text with PyPDF2         │
│ - Fallback to pdfplumber           │
│ - Detect encoding                  │
│                                    │
│ STEP 2: Resume Normalization       │
│ ───────────────────────────────────│
│ - Call OpenRouter Claude API       │
│ - Extract structured JSON:         │
│   {                                │
│     "personal_info": {...},        │
│     "education": [...],            │
│     "experience": [...],           │
│     "skills": [...],               │
│     "certifications": [...]        │
│   }                                │
│                                    │
│ STEP 3: Feature Engineering        │
│ ───────────────────────────────────│
│ - Normalize skills                 │
│ - Extract years of experience      │
│ - Identify education level         │
│ - Calculate career progression     │
│                                    │
│ STEP 4: Scoring                    │
│ ───────────────────────────────────│
│ A) Rule-Based Scores:              │
│    - Skill match (exact/partial)   │
│    - Experience relevance          │
│    - Education relevance           │
│                                    │
│ B) LLM-Enhanced Scores:            │
│    - Call Claude API with:         │
│      * Resume summary              │
│      * Job description             │
│      * Required skills             │
│    - Get holistic evaluation       │
│    - Adjust scores with reasoning  │
│                                    │
│ STEP 5: Generate Response          │
│ ───────────────────────────────────│
│ Return:                            │
│ {                                  │
│   "matching_scores": {             │
│     "overall_resume_score": 85,    │
│     "skill_match_score": 80,       │
│     "experience_relevance": 90,    │
│     "education_relevance": 85      │
│   },                               │
│   "professional_summary": "...",   │
│   "extracted_skills": [...],       │
│   "key_strengths": [...],          │
│   "skill_gaps": [...]              │
│ }                                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: Store AI Response     │
│                                │
│ UPDATE applications SET:       │
│ - resume_score = 85            │
│ - resume_data = {AI JSON}      │
│ - resume_summary = "..."       │
│ - resume_score_breakdown = {...}│
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Resume scoring complete        │
│ Score visible to recruiter     │
└────────────────────────────────┘
```

### 3. AI Recommendations Flow

```
┌──────────────────┐
│ /recommendations │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ GET /api/jobs/recommendations  │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: Recommendation Service│
│                                │
│ 1. Get candidate profile:      │
│    - primary_skills            │
│    - secondary_skills          │
│                                │
│ 2. Get published jobs (top 20) │
│                                │
│ 3. Call AI Service:            │
│    POST /match-jobs            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ AI Service: Hybrid Matching        │
│                                    │
│ PHASE 1: Rule-Based Matching       │
│ ──────────────────────────────────│
│ For each job:                      │
│ 1. Normalize candidate skills      │
│ 2. Normalize required skills       │
│ 3. Find exact matches              │
│ 4. Find related skills (families)  │
│ 5. Identify missing skills         │
│ 6. Calculate base score:           │
│    score = (exact * 10) +          │
│           (related * 5)            │
│    normalized to 0-100             │
│                                    │
│ PHASE 2: LLM Enhancement           │
│ ──────────────────────────────────│
│ Call Claude API with:              │
│ - Candidate skills                 │
│ - Jobs with base scores            │
│ - Skill details                    │
│                                    │
│ LLM analyzes:                      │
│ - Semantic similarity              │
│ - Inferred soft skills             │
│ - Critical skill gaps              │
│ - Career fit                       │
│                                    │
│ LLM adjusts scores (±10 points)    │
│ Generates match explanations       │
│                                    │
│ Return top 5 recommendations:      │
│ [                                  │
│   {                                │
│     "job_id": "...",               │
│     "job_title": "...",            │
│     "match_score": 87,             │
│     "reason": "Strong match..."    │
│   }                                │
│ ]                                  │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend: Cache results         │
│ (5 minute TTL)                 │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend: Display cards        │
│ - Match score visualization    │
│ - AI-generated reason          │
│ - Click to view job details    │
└────────────────────────────────┘
```

---

## Assessment Pipeline Flow

### Pipeline Configuration

```
Jobs Table:
- pipeline_first_round: 'APTITUDE' | 'DSA'

Configuration determines:
- Which round candidate takes first
- Which rounds are available
- Access control between rounds
```

### Pipeline Scenarios:

**Scenario 1: APTITUDE → DSA Pipeline**
```
Job Config: pipeline_first_round = 'APTITUDE'

1. Candidate shortlisted
   → next_round = 'APTITUDE'

2. Candidate starts APTITUDE
   → /aptitude/round/:jobId

3. APTITUDE completed
   → Check rounds config
   → If DSA exists: redirect /dsa/round/:jobId
   → Else: redirect /applications

4. DSA started
   → Can only start after APTITUDE done

5. DSA completed
   → redirect /applications
```

**Scenario 2: DSA → APTITUDE Pipeline**
```
Job Config: pipeline_first_round = 'DSA'

1. Candidate shortlisted
   → next_round = 'DSA'

2. Candidate starts DSA
   → /dsa/round/:jobId

3. DSA completed
   → Check rounds config
   → If APTITUDE exists: next_round = 'APTITUDE'
   → Redirect /applications

4. APTITUDE available
   → Candidate can start
   → /aptitude/round/:jobId

5. APTITUDE completed
   → All rounds done
```

### 1. Aptitude Round Flow

```
┌──────────────────┐
│ /applications    │
│ [Start Round]    │
│ next_round=APT   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ POST /api/aptitude/start       │
│ { "jobId": "..." }             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend Validation:            │
│ 1. Check candidate applied     │
│ 2. Check interview window      │
│    (selection_lock_from/until) │
│ 3. Check pipeline order        │
│    (if DSA first, block access)│
│ 4. Get job aptitude config     │
│ 5. Check existing attempt      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ If first attempt:              │
│ - Fetch N random questions     │
│   based on difficulty          │
│ - CREATE aptitude_attempt:     │
│   * attempt_id (UUID)          │
│   * status: 'started'          │
│   * starts_at: NOW()           │
│   * ends_at: NOW() + duration  │
│ - CREATE attempt_questions     │
│   (associate questions)        │
│                                │
│ If existing attempt in-progress│
│ - Return existing attempt      │
│ - Return existing questions    │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Response:                      │
│ {                              │
│   "attempt_id": "...",         │
│   "ends_at": "ISO timestamp",  │
│   "duration": 1800,            │
│   "questions": [               │
│     {                          │
│       "id": "q1",              │
│       "question": "...",       │
│       "options": ["A","B"...]  │
│     }                          │
│   ]                            │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Navigate: /aptitude/round/:job │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ APTITUDE ROUND PAGE                │
│                                    │
│ Exam Mode Initialization:          │
│ - Request fullscreen               │
│ - Start countdown timer            │
│ - Initialize proctoring session    │
│ - Set up event listeners:          │
│   * beforeunload (block back)      │
│   * visibilitychange (auto-submit) │
│   * blur (auto-submit)             │
│   * contextmenu (disable right-clk)│
│                                    │
│ Display:                           │
│ - Timer (MM:SS countdown)          │
│ - Question counter (1 of 20)       │
│ - Question text                    │
│ - Options (A/B/C/D radio buttons)  │
│ - [Clear] [Previous] [Next] btns   │
│ - Question navigator grid          │
│ - [Submit] button                  │
└────────┬───────────────────────────┘
         │
         │ User answers questions
         │ State stored in React state
         │
         │ [Submit clicked]
         │ OR Timer reaches 0
         │ OR Tab switch detected
         │ OR Window blur
         │
         ▼
┌────────────────────────────────┐
│ POST /api/aptitude/submit      │
│ {                              │
│   "attemptId": "...",          │
│   "answers": {                 │
│     "q1": "A",                 │
│     "q2": "C",                 │
│     ...                        │
│   }                            │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Backend Grading:               │
│                                │
│ 1. Check attempt not already   │
│    submitted                   │
│ 2. For each answer:            │
│    - Compare with correct answer│
│    - Mark as correct/incorrect │
│ 3. Calculate score:            │
│    score = (correct/total)*100 │
│ 4. UPDATE aptitude_attempt:    │
│    - status = 'submitted'      │
│    - score = calculated_score  │
│    - submitted_at = NOW()      │
│ 5. INSERT aptitude_answers     │
│    (save all answers)          │
│ 6. UPDATE application:         │
│    - aptitude_score = score    │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Response:                      │
│ {                              │
│   "score": 85,                 │
│   "totalQuestions": 20,        │
│   "correctAnswers": 17,        │
│   "passed": true               │
│ }                              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Frontend: Show results modal   │
│ - Display score                │
│ - Show next steps              │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Check rounds config:           │
│ - If DSA round exists          │
│   → Redirect /dsa/round/:jobId │
│ - Else                         │
│   → Redirect /applications     │
└────────────────────────────────┘
```

### 2. DSA Round Flow

```
┌──────────────────┐
│ /applications    │
│ [Start Round]    │
│ next_round=DSA   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────┐
│ POST /api/dsa/start            │
│ { "jobId": "..." }             │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend Validation:                 │
│ 1. Check candidate applied          │
│ 2. Check interview window           │
│ 3. Get published DSA config         │
│ 4. Check pipeline order:            │
│    - If APTITUDE first, check       │
│      aptitude completion            │
│ 5. Check existing attempt           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ If first attempt:                   │
│ - Get config problems (3)           │
│ - CREATE dsa_round_attempt:         │
│   * attempt_id (UUID)               │
│   * config_id                       │
│   * candidate_id                    │
│   * status: 'started'               │
│   * started_at: NOW()               │
│   * expires_at: NOW() + duration    │
│ - Store in Redis:                   │
│   * Expiry timestamp                │
│   * Initial activity counters       │
│                                     │
│ If existing in-progress:            │
│ - Return existing attempt           │
│ - Check Redis expiry                │
│   (if expired, auto-submit)         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Response:                           │
│ {                                   │
│   "attemptId": "...",               │
│   "expiresAt": "ISO timestamp",     │
│   "durationSeconds": 3600,          │
│   "problems": [                     │
│     {                               │
│       "id": "p1",                   │
│       "datasetId": "two-sum",       │
│       "title": "Two Sum",           │
│       "difficulty": "easy",         │
│       "statement": "...",           │
│       "constraints": "...",         │
│       "boilerplate": "...",         │
│       "sampleTests": [...]          │
│     }                               │
│   ]                                 │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Navigate: /dsa/round/:jobId    │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ DSA ROUND PAGE                          │
│                                         │
│ Exam Mode Initialization:               │
│ - Request fullscreen                    │
│ - Start countdown timer                 │
│ - Initialize proctoring session         │
│ - Set up security listeners             │
│ - Load existing drafts from Redis       │
│                                         │
│ Layout: Split View                      │
│ ────────────────────────────────────────│
│ LEFT PANEL:                             │
│ - Problem tabs (1/2/3)                  │
│ - Problem statement                     │
│ - Constraints                           │
│ - Sample test cases                     │
│                                         │
│ RIGHT PANEL:                            │
│ - Language: C++ (GNU C++17)             │
│ - Monaco Code Editor                    │
│ - Custom Input (collapsible)            │
│ - [Run Code] [Submit] buttons           │
│ - Font size controls                    │
│ - Results panel (bottom)                │
│                                         │
│ RESIZABLE DIVIDER between panels        │
└────────┬────────────────────────────────┘
         │
         │ User writes code
         │ Auto-save every 30 seconds
         │
         ▼
┌────────────────────────────────┐
│ POST /api/dsa/draft            │
│ {                              │
│   "attemptId": "...",          │
│   "problemId": "p1",           │
│   "sourceCode": "..."          │
│ }                              │
│                                │
│ Saved to Redis:                │
│ dsa:round:{attemptId}:drafts   │
└────────────────────────────────┘
         │
         │ [Run Code clicked]
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/dsa/run                   │
│ {                                   │
│   "attemptId": "...",               │
│   "problemId": "p1",                │
│   "sourceCode": "...",              │
│   "customInput": "1 2 3"            │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend:                            │
│ 1. Validate attempt is active       │
│ 2. Get custom test case             │
│ 3. Call Judge0 API:                 │
│    POST /submissions                │
│    {                                │
│      "language_id": 54,             │
│      "source_code": "...",          │
│      "stdin": "1 2 3",              │
│      "cpu_time_limit": 2.0          │
│    }                                │
│ 4. Get submission token             │
│ 5. Poll Judge0:                     │
│    GET /submissions/{token}         │
│    (wait for completion)            │
│ 6. Return result                    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Response:                           │
│ {                                   │
│   "status": "Accepted",             │
│   "stdout": "3",                    │
│   "stderr": "",                     │
│   "time": "0.023s",                 │
│   "memory": "2048KB"                │
│ }                                   │
│                                     │
│ Display in Results Panel            │
└─────────────────────────────────────┘
         │
         │ [Submit clicked]
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/dsa/submit                │
│ {                                   │
│   "attemptId": "...",               │
│   "problemId": "p1",                │
│   "sourceCode": "..."               │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend: Full Evaluation            │
│                                     │
│ 1. Check not already submitted      │
│ 2. Get ALL test cases (public+hidden│
│ 3. For each test case:              │
│    a. Call Judge0                   │
│    b. Compare output                │
│    c. Record pass/fail              │
│ 4. Calculate score:                 │
│    score = (passed/total) * 100     │
│ 5. INSERT dsa_round_submissions:    │
│    - is_final = TRUE                │
│    - score                          │
│    - test_results JSON              │
│ 6. Lock problem (no more submits)   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Response: Test Results              │
│ [                                   │
│   {                                 │
│     "testCase": 1,                  │
│     "status": "Passed",             │
│     "input": "...",                 │
│     "expected": "...",              │
│     "actual": "...",                │
│     "time": "0.02s"                 │
│   },                                │
│   ...                               │
│ ]                                   │
│                                     │
│ Display results                     │
│ Lock problem (disable edit/submit)  │
└─────────────────────────────────────┘
         │
         │ All problems submitted
         │ OR Timer expires
         │ OR Tab switch
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/dsa/finalize              │
│ Auto-submits any remaining problems │
│ with current draft code             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend:                            │
│ 1. Submit remaining problems (score │
│    with current code or 0)          │
│ 2. Calculate overall round score:   │
│    avg of all problem scores        │
│ 3. UPDATE dsa_round_attempt:        │
│    - status = 'completed'           │
│    - final_score = avg              │
│    - completed_at = NOW()           │
│ 4. UPDATE application:              │
│    - dsa_score = final_score        │
└────────┬────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Check rounds config:           │
│ - If more online rounds        │
│   → Redirect to next round     │
│ - Else                         │
│   → Redirect /applications     │
└────────────────────────────────┘
```

---

## AI-Powered Features Flow

### 1. Proctoring System Flow

```
┌──────────────────────────┐
│ Assessment Round Started │
│ (Aptitude or DSA)        │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Frontend: Initialize Proctoring│
│ useProctoring() hook           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ POST /api/proctoring/start     │
│ {                              │
│   "jobId": "...",              │
│   "roundType": "APTITUDE",     │
│   "attemptId": "..."           │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend:                       │
│ - Create proctoring_session    │
│ - Return session_id            │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Frontend: Start Monitoring     │
│                                │
│ 1. WEBCAM MONITORING:          │
│    - Request camera permission │
│    - Capture frame every 5s    │
│    - Convert to base64         │
│    - Send to backend           │
│                                │
│ 2. BROWSER EVENTS:             │
│    - Listen for:               │
│      * visibilitychange        │
│      * blur                    │
│      * focus                   │
│      * copy/paste              │
│      * contextmenu             │
│    - Send events to backend    │
│                                │
│ 3. WEBSOCKET CONNECTION:       │
│    - Connect to:               │
│      ws://localhost:3000/      │
│        proctoring/ws           │
│    - Real-time event stream    │
└──────┬─────────────────────────┘
       │
       │ Frame Captured
       ▼
┌────────────────────────────────┐
│ POST /api/proctoring/frame     │
│ {                              │
│   "sessionId": "...",          │
│   "frameData": "base64..."     │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend → AI Service:              │
│ POST /ai/proctoring/process-frame  │
└──────┬─────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ AI Service: OpenCV Processing      │
│                                     │
│ 1. Decode base64 image              │
│ 2. Face Detection (Haar Cascade):   │
│    - Count faces                    │
│    - Detect face position           │
│ 3. Gaze Detection:                  │
│    - Eye region extraction          │
│    - Estimate looking away          │
│ 4. Object Detection (YOLOv8):       │
│    - Detect phone/device            │
│    - Detect unauthorized person     │
│                                     │
│ Return:                             │
│ {                                   │
│   "face_count": 1,                  │
│   "looking_away": false,            │
│   "phone_detected": false           │
│ }                                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: Create Events         │
│                                │
│ If face_count == 0:            │
│   INSERT event: FACE_ABSENT    │
│                                │
│ If face_count > 1:             │
│   INSERT event: MULTIPLE_FACE  │
│                                │
│ If looking_away:               │
│   INSERT event: LOOKING_AWAY   │
│                                │
│ If phone_detected:             │
│   INSERT event: PHONE_DETECTED │
└──────┬─────────────────────────┘
       │
       │ Browser Event
       ▼
┌────────────────────────────────┐
│ POST /api/proctoring/event     │
│ {                              │
│   "sessionId": "...",          │
│   "eventType": "TAB_SWITCH",   │
│   "metadata": {...}            │
│ }                              │
│                                │
│ Event Types:                   │
│ - TAB_SWITCH                   │
│ - WINDOW_BLUR                  │
│ - COPY_PASTE                   │
│ - RIGHT_CLICK                  │
│ - MULTIPLE_FACE                │
│ - FACE_ABSENT                  │
│ - LOOKING_AWAY                 │
│ - PHONE_DETECTED               │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ INSERT INTO proctoring_events  │
│ - session_id                   │
│ - event_type                   │
│ - metadata                     │
│ - occurred_at: NOW()           │
└──────┬─────────────────────────┘
       │
       │ Assessment Complete
       ▼
┌────────────────────────────────┐
│ POST /api/proctoring/evaluate  │
│ { "sessionId": "..." }         │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: Aggregate Events      │
│                                │
│ SELECT event_type, COUNT(*)   │
│ FROM proctoring_events         │
│ WHERE session_id = ...         │
│ GROUP BY event_type            │
│                                │
│ Generate Summary:              │
│ "2 tab switches, 1 face absent,│
│  3 looking away instances"     │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ AI Service: Risk Evaluation        │
│ POST /ai/proctoring/evaluate-risk  │
│                                    │
│ Call Claude API with:              │
│ - Event summary                    │
│ - Context                          │
│                                    │
│ LLM analyzes:                      │
│ - Severity of violations           │
│ - Pattern of behavior              │
│ - Intent assessment                │
│                                    │
│ Return:                            │
│ {                                  │
│   "risk_score": 35,                │
│   "risk_level": "Medium",          │
│   "reason": "Multiple tab          │
│    switches suggest potential      │
│    reference lookup..."            │
│ }                                  │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ UPDATE proctoring_sessions:    │
│ - risk_score = 35              │
│ - risk_level = Medium          │
│ - summary = "..."              │
│ - evaluated_at = NOW()         │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Display to recruiter:          │
│ - View proctoring report       │
│ - Event timeline               │
│ - Risk assessment              │
└────────────────────────────────┘
```

---

## Data Flow Architecture

### Database Schema Overview

```
users
├── id (PK)
├── email
├── role (CANDIDATE | RECRUITER)
├── is_password_set
└── google_id

candidate_profiles
├── id (PK)
├── user_id (FK → users)
├── full_name
├── primary_skills []
├── secondary_skills []
├── preferred_roles []
├── years_of_experience
└── profile_completed

recruiters
├── id (PK)
├── user_id (FK → users)
├── full_name
└── organization_id

jobs
├── id (PK)
├── recruiter_id (FK → recruiters)
├── title
├── description
├── requirements []
├── status (DRAFT | PUBLISHED | CLOSED)
├── pipeline_first_round (APTITUDE | DSA)
├── aptitude_enabled
├── selection_lock_from
└── selection_lock_until

applications
├── id (PK)
├── candidate_id (FK → candidate_profiles)
├── job_id (FK → jobs)
├── resume_file_path
├── status (PENDING | SHORTLISTED | REJECTED)
├── stage (applied | shortlisted)
├── next_round (APTITUDE | DSA)
├── resume_score (AI generated)
├── aptitude_score
├── dsa_score
├── coding_score
└── rank (assigned by AI)

aptitude_attempts
├── id (PK)
├── candidate_id
├── job_id
├── status (started | submitted)
├── score
├── started_at
└── ends_at

dsa_round_attempts
├── id (PK)
├── candidate_id
├── config_id
├── status (started | completed)
├── final_score
└── expires_at

dsa_round_submissions
├── id (PK)
├── attempt_id
├── problem_id
├── source_code
├── is_final
├── score
└── test_results

proctoring_sessions
├── id (PK)
├── candidate_id
├── job_id
├── round_type
├── attempt_id
├── risk_score
└── risk_level

proctoring_events
├── id (PK)
├── session_id
├── event_type
└── occurred_at
```

### API Endpoints Summary

**Authentication:**
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/google`
- POST `/auth/set-password`
- GET `/auth/me`

**Candidate:**
- POST `/api/candidates/profile`
- GET `/api/candidates/profile`
- PATCH `/api/candidates/profile`

**Recruiter:**
- POST `/api/recruiters/profile`
- GET `/api/recruiters/profile`

**Jobs:**
- GET `/api/jobs` (published)
- GET `/api/jobs/:id`
- POST `/api/jobs` (recruiter)
- PATCH `/api/jobs/:id`
- DELETE `/api/jobs/:id`
- GET `/api/jobs/recommendations` (AI)

**Applications:**
- POST `/api/applications` (apply)
- GET `/api/applications` (role-based)
- PATCH `/api/applications/:id` (shortlist/reject)

**Rounds:**
- GET `/api/rounds/:jobId`

**Aptitude:**
- POST `/api/aptitude/start`
- POST `/api/aptitude/submit`

**DSA:**
- POST `/api/dsa/start`
- POST `/api/dsa/draft`
- POST `/api/dsa/run`
- POST `/api/dsa/submit`
- POST `/api/dsa/finalize`

**Proctoring:**
- POST `/api/proctoring/start`
- POST `/api/proctoring/frame`
- POST `/api/proctoring/event`
- POST `/api/proctoring/evaluate`
- WS `/proctoring/ws`

**Recruiter Scoring:**
- GET `/api/recruiter/candidates/:jobId`
- POST `/api/recruiter/rank`
- POST `/api/recruiter/select`

**AI Service:**
- POST `/ai/resume/score`
- POST `/match-jobs`
- POST `/ai/proctoring/process-frame`
- POST `/ai/proctoring/evaluate-risk`

---

## Error Handling & Edge Cases

### Security Violations:
- Tab switch during exam → Auto-submit
- Window blur → Auto-submit
- Browser back button → Blocked
- Right-click → Disabled
- Copy/paste → Logged as event

### Time Management:
- Timer reaches 0 → Auto-submit
- Late start within window → Allowed
- Start before window → Blocked
- Start after window → Blocked

### Pipeline Constraints:
- DSA first pipeline → Aptitude locked until DSA done
- Aptitude first pipeline → DSA locked until Aptitude done
- Missing round config → Error message
- Already completed → Block re-attempt

### Resume Processing:
- PDF parsing fails → Score = NULL
- AI service timeout → Retry logic
- Invalid PDF → Validation error
- Score out of range → Clamp to 0-100

### Code Execution:
- Judge0 timeout → Show error
- Compilation error → Show error details
- Runtime error → Show stderr
- Memory limit → Judge0 handles

---

This flow documentation provides a comprehensive view of all workflows, integrations, and data flows in the Autonomous Recruitment Ecosystem.
