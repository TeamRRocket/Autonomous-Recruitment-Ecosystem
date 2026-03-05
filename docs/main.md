# Autonomous Recruitment Ecosystem - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Vision & Goals](#project-vision--goals)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Core Features & Functionality](#core-features--functionality)
5. [AI-Powered Components](#ai-powered-components)
6. [Assessment System](#assessment-system)
7. [Proctoring & Security](#proctoring--security)
8. [User Roles & Capabilities](#user-roles--capabilities)
9. [Technical Implementation](#technical-implementation)
10. [Database Design](#database-design)
11. [API Architecture](#api-architecture)
12. [Frontend Architecture](#frontend-architecture)
13. [Security & Authentication](#security--authentication)
14. [Deployment & Infrastructure](#deployment--infrastructure)
15. [Future Enhancements](#future-enhancements)

---

## Project Overview

### What is Autonomous Recruitment Ecosystem?

The **Autonomous Recruitment Ecosystem** (also known as **HireFlow**) is a comprehensive, AI-powered recruitment platform that automates and streamlines the entire hiring process from job posting to candidate evaluation. The platform connects recruiters with candidates through an intelligent matching system, automated assessments, and AI-driven evaluation tools.

### Key Value Propositions

**For Recruiters:**
- Automated resume screening and scoring using AI
- Customizable multi-stage assessment pipeline
- AI-powered candidate ranking and selection
- Comprehensive candidate evaluation dashboards
- Automated email notifications and workflow management
- Proctoring and integrity monitoring during assessments

**For Candidates:**
- AI-powered job recommendations based on skills and experience
- Streamlined application process with resume upload
- Fair, standardized technical assessments
- Real-time feedback on assessment performance
- Transparent evaluation criteria
- User-friendly coding environment with modern IDE features

### Business Problem Solved

Traditional recruitment processes face several challenges:
1. **Manual Resume Screening**: HR teams spend countless hours reviewing resumes
2. **Subjective Evaluation**: Inconsistent candidate assessment criteria
3. **Scheduling Complexity**: Coordinating interviews is time-consuming
4. **Limited Scalability**: High-volume hiring is resource-intensive
5. **Skill Mismatch**: Difficulty finding candidates with the right skills
6. **Assessment Integrity**: Ensuring fair and secure testing environments

**HireFlow addresses these challenges through:**
- AI-powered resume parsing and scoring (saves 70%+ of screening time)
- Standardized, objective evaluation metrics across all candidates
- Automated online assessments with flexible scheduling windows
- Scalable architecture handling thousands of concurrent assessments
- Hybrid AI matching algorithm (rule-based + LLM) for accurate skill matching
- Real-time proctoring with CV-based monitoring and violation detection

---

## Project Vision & Goals

### Vision Statement

To revolutionize the recruitment industry by creating an autonomous, AI-driven ecosystem that eliminates bias, reduces time-to-hire, and ensures the best talent-job matches through intelligent automation and data-driven decision making.

### Primary Goals

1. **Automation**: Reduce manual work by 80% through AI-powered automation
2. **Objectivity**: Provide unbiased, data-driven candidate evaluations
3. **Efficiency**: Cut recruitment cycle time from weeks to days
4. **Scalability**: Enable high-volume hiring without proportional resource increase
5. **Quality**: Improve hire quality through intelligent matching and comprehensive assessment
6. **Security**: Ensure assessment integrity through advanced proctoring

### Success Metrics

- Resume screening time reduced by 70%
- Time-to-hire reduced by 50%
- Candidate-job match accuracy > 85%
- Assessment completion rate > 90%
- Proctoring violation detection rate > 95%
- User satisfaction score > 4.5/5

---

## Architecture & Technology Stack

### System Architecture

The platform follows a **microservices-inspired architecture** with three main services:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  React SPA (Vite) - Port 5173                           │
│  - Role-based UI (Candidate/Recruiter)                  │
│  - Monaco Editor for coding                             │
│  - WebSocket client for proctoring                      │
└────────────┬────────────────────────────────────────────┘
             │ HTTPS/WSS
             ▼
┌─────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                        │
│  Node.js + Express - Port 3000                          │
│  - RESTful API                                          │
│  - JWT Authentication                                   │
│  - WebSocket Server (Proctoring)                        │
│  - File Upload Handling                                 │
│  - Business Logic Layer                                 │
└────────┬───────────────────────┬────────────────────────┘
         │                       │
         ▼                       ▼
┌────────────────┐      ┌────────────────────────┐
│  PostgreSQL    │      │   Redis Cache          │
│  - Primary DB  │      │   - Session Store      │
│  - Relations   │      │   - Draft Storage      │
│  - Constraints │      │   - TTL Management     │
└────────────────┘      └────────────────────────┘
         │
         │ HTTP/REST
         ▼
┌─────────────────────────────────────────────────────────┐
│                    AI SERVICE LAYER                      │
│  Python FastAPI - Port 8000                             │
│  - Resume Parsing (PyPDF2, pdfplumber)                  │
│  - LLM Integration (Claude 3.5 Sonnet via OpenRouter)   │
│  - Skill Matching (Hybrid Algorithm)                    │
│  - OpenCV Face Detection                                │
│  - YOLOv8 Object Detection                              │
│  - Risk Evaluation                                      │
└─────────────────────────────────────────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                        │
│  - OpenRouter API (Claude 3.5 Sonnet)                   │
│  - Judge0 CE API (Code Execution)                       │
│  - Google OAuth                                         │
│  - Email Service (SMTP)                                 │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend (React Application)
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite (fast builds, hot reload)
- **Routing**: React Router v6 (declarative routing)
- **Styling**: TailwindCSS (utility-first)
- **State Management**: 
  - Context API (global user state)
  - React Query for server state (optional enhancement)
- **Code Editor**: Monaco Editor (VS Code engine)
- **UI Components**: Custom components with shadcn/ui patterns
- **HTTP Client**: Axios (with interceptors)
- **WebSocket**: Native WebSocket API
- **Form Handling**: React Hook Form (validation)
- **Notifications**: React Hot Toast

#### Backend (Node.js Application)
- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js (minimal, flexible)
- **Language**: JavaScript (ES6+)
- **Database Client**: node-postgres (pg)
- **Authentication**: 
  - JSON Web Tokens (JWT)
  - Google OAuth 2.0
- **Session Management**: 
  - Redis (session store)
  - In-memory cache
- **File Upload**: Multer (multipart/form-data)
- **WebSocket**: ws library (proctoring realtime)
- **Validation**: Custom validators + joi (optional)
- **Logging**: Winston (structured logging)
- **Environment**: dotenv (config management)

#### AI Service (Python Application)
- **Framework**: FastAPI (async, high performance)
- **Language**: Python 3.9+
- **PDF Parsing**: 
  - PyPDF2 (primary)
  - pdfplumber (fallback)
- **Computer Vision**:
  - OpenCV (face detection)
  - YOLOv8 (object detection)
  - Pillow (image processing)
- **NLP/LLM**:
  - OpenRouter API wrapper
  - Claude 3.5 Sonnet (via OpenRouter)
- **Data Processing**: 
  - Pandas (optional, for data analysis)
  - NumPy (numerical operations)
- **HTTP Client**: requests library
- **Validation**: Pydantic models

#### Database & Caching
- **Primary Database**: PostgreSQL 14+
  - Relational integrity
  - JSONB support for flexible fields
  - Full-text search capabilities
  - UUID primary keys
- **Cache Layer**: Redis 6+
  - Session management
  - Draft code storage (TTL)
  - Rate limiting (optional)
  - Pub/Sub for WebSocket (optional)

#### External Services
- **LLM Provider**: OpenRouter (Claude 3.5 Sonnet)
  - Resume extraction
  - Job matching enhancement
  - Risk evaluation
- **Code Execution**: Judge0 CE (Community Edition)
  - Supports 50+ languages
  - Sandboxed execution
  - Time/memory limits
  - Test case validation
- **Authentication**: Google OAuth 2.0
- **Email**: SMTP (Nodemailer)

#### DevOps & Deployment
- **Version Control**: Git
- **Package Managers**: 
  - npm (Node.js)
  - pip (Python)
- **Process Management**: 
  - PM2 (Node.js production)
  - Uvicorn (Python ASGI)
- **Containerization**: Docker (optional)
- **Reverse Proxy**: Nginx (production)

---

## Core Features & Functionality

### 1. Authentication & User Management

#### User Registration & Onboarding

**Registration Flow:**
- Multiple registration methods supported:
  - Google OAuth 2.0 (primary)
  - Email/Password (traditional)
- Role selection during signup (Candidate/Recruiter)
- Email verification (optional)
- Mandatory password setup for OAuth users
- Password requirements enforcement:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

**Onboarding System:**
- **Candidate Onboarding** (3-step wizard):
  - Step 1: Basic Information
    - Full name
    - Years of experience
  - Step 2: Skills & Experience
    - Primary skills (tag input)
    - Secondary skills (tag input)
  - Step 3: Preferences
    - Preferred job roles
    - Preferred locations
  
- **Recruiter Onboarding** (simplified):
  - Full name
  - Organization affiliation (automatic)

**Profile Completion Enforcement:**
- Profile completion flag in database
- Route guard blocks access to main app until profile complete
- Redirect to appropriate onboarding flow
- One-time setup, persistent across sessions

#### Session Management

- **JWT-based authentication:**
  - Access token (short-lived, 1 hour)
  - Refresh token (long-lived, 7 days)
  - HttpOnly cookies for security
  - CSRF protection

- **User context:**
  - Global AuthContext in React
  - Automatic token refresh
  - Persistent login across browser sessions
  - Logout clears all tokens and session

### 2. Job Management (Recruiter)

#### Job Creation Wizard - "HireFlow Architect"

**Step 1: Job Description**
- Job title (required)
- Location (city/remote)
- Job type (Full-time/Part-time/Contract/Remote)
- Experience level (Entry/Mid/Senior)
- Degree requirements
- Required skills (multi-tag input with autocomplete)
- Job description (rich text)
- Responsibilities list
- Preferred qualifications
- Save as draft feature

**Step 2: Assessment Round Selection**
- Available rounds:
  - Aptitude Round (MCQ general aptitude)
  - DSA Round (Data Structures & Algorithms)
  - Coding Round (single problem, legacy)
- Pipeline ordering:
  - Aptitude First → DSA Second
  - DSA First → Aptitude Second
- Visual round configuration
- Round dependencies enforcement

**Step 3: Round Configuration**

*Aptitude Configuration:*
- Difficulty level: Easy/Medium/Hard
- Duration in minutes (e.g., 30 min)
- Number of questions (e.g., 20)
- Auto-fetch questions from question bank

*DSA Configuration:*
- Number of problems (1-5)
- Total time limit (e.g., 60 minutes)
- Problem browser/selector:
  - Filter by difficulty
  - Filter by topic/tag
  - Preview problem statement
  - Select multiple problems
  - Define problem order
- Test case configuration per problem

**Step 4: Review & Publish**
- Summary of job details
- Assessment pipeline visual
- Round configuration recap
- Actions:
  - Save as Draft
  - Publish Job (makes it visible to candidates)

#### Job Lifecycle Management

**Job States:**
1. **DRAFT**: Created but not published
2. **PUBLISHED**: Visible to candidates, accepting applications
3. **CLOSED**: No longer accepting applications, ready for selection

**Job Operations:**
- **View**: See full job details
- **Edit**: Modify job information and rounds
- **Publish**: Make draft jobs visible
- **Close**: Stop accepting new applications
- **Delete**: Remove closed/draft jobs
- **Duplicate**: Clone job configuration (future)

#### Job Dashboard

- **Recruiter's job list with filters:**
  - Search by job title
  - Filter by status (Draft/Published/Closed)
  - Sort by date, applications count
  
- **Job cards display:**
  - Job title and ID
  - Location and type
  - Posted date
  - Status badge (color-coded)
  - Application count
  - Context-sensitive action buttons

### 3. Application Management

#### Candidate Application Process

**Job Discovery:**
- Browse all published jobs
- Advanced filtering:
  - By location (multi-select)
  - By experience level
  - By degree requirements
  - By job type
  - By organization
- Global search across all fields
- Job cards with key information
- "Learn more" to view full details

**Application Submission:**
- Resume upload (PDF only, max 10MB)
- Client-side validation:
  - File type checking
  - File size validation
  - PDF format verification
- One application per job enforcement
- Instant feedback on submission
- Redirect to applications page

**Application Tracking:**
- Centralized applications dashboard
- Search and filter applications:
  - By status (Pending/Shortlisted/Rejected)
  - By job title
  - By date range
- Application status indicators:
  - Pending Review
  - Shortlisted for Interview
  - Rejected
- Resume preview/download
- "Start Round" button (conditional):
  - Only appears when:
    - Status = SHORTLISTED
    - next_round is set (APTITUDE/DSA)
    - Current time within interview window

#### Recruiter Application Review

**Applications Dashboard:**
- Table view of all applications across jobs
- Columns:
  - Candidate name
  - Job title
  - Application date
  - Resume score (AI-generated, 0-100)
  - Status
  - Actions
- Sortable columns
- Pagination support

**Application Actions:**
- **View Resume**: Open PDF in new tab or modal viewer
- **Shortlist**: Mark candidate for interview rounds
  - Sets status to SHORTLISTED
  - Sets next_round based on job config
  - Sends email notification
- **Reject**: Remove candidate from consideration
  - Updates status to REJECTED
  - Removes from active pipeline
  - Sends rejection email

**Filters & Search:**
- Search by candidate name or email
- Filter by job
- Filter by status
- Filter by date range
- Export to CSV (future)

### 4. AI-Powered Resume Scoring

#### Resume Processing Pipeline

**Phase 1: Document Parsing**
```
PDF Upload → Base64 Encoding → AI Service → Text Extraction
```
- **Primary Parser**: PyPDF2
  - Fast, handles most PDFs
  - Extracts text layout
  - Preserves structure
- **Fallback Parser**: pdfplumber
  - More robust
  - Better layout preservation
  - Handles complex PDFs
- **Error Handling**:
  - If both fail, set score to NULL
  - Log parsing errors
  - Notify recruiter of issues

**Phase 2: Resume Normalization (LLM-based)**

Sends raw text to Claude 3.5 Sonnet with structured prompt:

*Input:*
- Raw resume text (2000-5000 words)
- Extraction schema definition
- Field requirements

*Processing:*
- LLM extracts structured JSON:
  ```json
  {
    "personal_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "location": "San Francisco, CA"
    },
    "education": [
      {
        "degree": "Bachelor of Science",
        "major": "Computer Science",
        "institution": "Stanford University",
        "graduation_year": "2020",
        "gpa": "3.8"
      }
    ],
    "experience": [
      {
        "company": "Google",
        "title": "Software Engineer",
        "start_date": "2020-06",
        "end_date": "2023-12",
        "duration": "3 years 6 months",
        "description": "Worked on...",
        "technologies": ["Python", "TensorFlow"]
      }
    ],
    "skills": {
      "technical": ["Python", "JavaScript", "React"],
      "soft": ["Leadership", "Communication"]
    },
    "certifications": [
      {
        "name": "AWS Certified Developer",
        "issuer": "Amazon",
        "year": "2022"
      }
    ]
  }
  ```
- Handles variations in format
- Normalizes dates, locations
- Extracts implicit information

**Phase 3: Feature Engineering**
- **Skill Normalization**:
  - "JS" → "javascript"
  - "React.js" → "react"
  - "ML" → "machine learning"
- **Experience Calculation**:
  - Total years of experience
  - Years in relevant roles
  - Career progression trajectory
- **Education Scoring**:
  - Degree level (PhD > Masters > Bachelors)
  - Institution prestige (optional)
  - GPA if available
  - Relevant major

**Phase 4: Scoring Algorithm**

*A) Rule-Based Component (40% weight):*
1. **Skill Match Score** (40 points):
   - Exact matches: 10 points each
   - Related skills (same family): 5 points each
   - Missing critical skills: -5 points each
   - Formula: `min(40, (exact * 10 + related * 5 - missing * 5))`

2. **Experience Relevance** (30 points):
   - Years of experience alignment: 0-15 points
   - Relevant role experience: 0-10 points
   - Industry experience: 0-5 points

3. **Education Relevance** (20 points):
   - Degree level match: 0-10 points
   - Major relevance: 0-10 points

4. **Additional Factors** (10 points):
   - Certifications: 0-5 points
   - Awards/achievements: 0-5 points

*B) LLM Enhancement Component (60% weight):*
- Send to Claude 3.5 Sonnet:
  - Resume summary
  - Job description
  - Required skills list
  - Rule-based score breakdown
  
- LLM performs holistic evaluation:
  - Semantic skill matching
  - Career trajectory assessment
  - Culture fit indicators (from experience descriptions)
  - Leadership and soft skills inference
  - Project complexity evaluation
  
- LLM returns:
  - Adjusted overall score (0-100)
  - Reasoning for adjustments
  - Key strengths identified
  - Skill gaps highlighted

*C) Final Score Calculation:*
```
final_score = (rule_based_score * 0.4) + (llm_score * 0.6)
normalized_score = clamp(final_score, 0, 100)
```

**Phase 5: Storage & Display**
- Store in application record:
  - `resume_score`: Overall score (0-100)
  - `resume_data`: Full JSON from LLM extraction
  - `resume_summary`: Professional summary
  - `resume_score_breakdown`: Component scores
- Visible to recruiter immediately
- Used in ranking algorithm

### 5. AI-Powered Job Matching & Recommendations

#### Hybrid Matching Algorithm

**Trigger**: Candidate visits `/recommendations` page

**Input Data:**
- Candidate skills (primary + secondary)
- All published jobs (top 20 most recent)
- Job required skills

**Phase 1: Rule-Based Matching**

*Skill Normalization:*
- Apply skill aliases dictionary
- Convert to lowercase
- Remove special characters
- Group into skill families:
  - javascript_ecosystem: {javascript, nodejs, react, vue, angular, typescript}
  - python_ecosystem: {python, django, flask, fastapi}
  - databases: {postgresql, mysql, mongodb, redis}
  - cloud: {aws, gcp, azure}
  - devops: {docker, kubernetes, ci/cd}
  - etc.

*Matching Logic for Each Job:*
1. **Exact Matches**: Candidate skill = Required skill (normalized)
2. **Related Matches**: Skills in same family
3. **Missing Skills**: Required skills not matched
4. **Soft Skills**: Inferred from technical background

*Base Score Calculation:*
```python
exact_match_bonus = len(exact_matches) * 10
related_match_bonus = len(related_matches) * 5
missing_penalty = len(missing_skills) * -2

base_score = exact_match_bonus + related_match_bonus + missing_penalty
normalized_score = clamp(base_score, 0, 100)
```

**Phase 2: LLM Enhancement**

*Prepare Context:*
```json
{
  "candidate_skills": ["Python", "Django", "PostgreSQL", "AWS"],
  "jobs_with_base_scores": [
    {
      "job_id": "j1",
      "job_title": "Backend Developer",
      "required_skills": ["Python", "FastAPI", "Docker"],
      "exact_matches": ["Python"],
      "possible_matches": ["Django relates to FastAPI"],
      "missing_skills": ["Docker"],
      "base_score": 65
    }
  ]
}
```

*LLM Analysis (Claude 3.5 Sonnet):*

System Prompt:
```
You are an AI recruitment assistant. Analyze skill matches between 
candidate and jobs. Consider:
1. Semantic similarities (e.g., "REST APIs" ↔ "API Development")
2. Inferred soft skills from tech stack
3. Career progression indicators
4. Critical vs nice-to-have skills

Adjust scores ±10 points based on analysis.
Generate concise match explanations (1-2 sentences).
Return top 5 recommendations.
```

*LLM Returns:*
```json
{
  "recommendations": [
    {
      "job_id": "j1",
      "job_title": "Backend Developer",
      "match_score": 87,  // Adjusted from 65
      "reason": "Strong Python expertise with Django. FastAPI 
                 transition is natural. Docker can be learned quickly."
    },
    {
      "job_id": "j2",
      "job_title": "Full Stack Engineer",
      "match_score": 72,
      "reason": "Backend skills align well. Missing frontend 
                 React, but PostgreSQL and AWS experience match."
    }
  ]
}
```

**Phase 3: Caching & Display**
- Cache recommendations for 5 minutes (in-memory)
- Avoid redundant AI calls
- Display as recommendation cards:
  - Match score progress circle
  - AI-generated reason
  - Job title and org
  - "View Job" CTA

**Fallback Strategy:**
- If LLM fails (timeout, error), use pure rule-based scores
- Generate simple reasons from match data
- Ensure system always returns recommendations

---

## Assessment System

### Multi-Round Assessment Pipeline

#### Pipeline Configuration

**Supported Rounds:**
1. **Aptitude Round** (MCQ-based)
2. **DSA Round** (Multi-problem coding)
3. **Coding Round** (Single problem, legacy)

**Pipeline Models:**
```
Model 1: APTITUDE → DSA
- First: Aptitude test (20 questions, 30 min)
- Second: DSA problems (3 problems, 60 min)
- Completion: Both rounds required

Model 2: DSA → APTITUDE
- First: DSA problems (3 problems, 60 min)
- Second: Aptitude test (20 questions, 30 min)
- Completion: Both rounds required

Model 3: DSA Only
- Single DSA round
- No aptitude requirement

Model 4: APTITUDE Only
- Single aptitude round
- No coding requirement
```

**Access Control:**
- `pipeline_first_round` field in jobs table determines order
- Candidates can only access rounds in configured order
- Backend validates round access on `/start` API call
- If user tries to skip rounds, API returns 403 Forbidden

#### Interview Window System

**Purpose**: Schedule candidates to take assessments within specific time frames

**Configuration** (by recruiter during selection):
- `selection_lock_from`: Start timestamp (e.g., "2026-02-25 09:00")
- `selection_lock_until`: End timestamp (e.g., "2026-02-25 18:00")
- Duration: Typically 6-9 hours on a specific day

**Enforcement:**
- Backend validates on `/start` request:
  - If `NOW() < selection_lock_from`: "Round not active yet"
  - If `NOW() > selection_lock_until`: "Interview window ended"
  - If within window: Allow start
- Window can be days in the future (scheduled interviews)
- Prevents late/early access
- Used for batch candidate processing

### 1. Aptitude Assessment

#### Features
- Multiple-choice questions (4 options: A, B, C, D)
- Questions fetched from centralized question bank
- Difficulty-based filtering (Easy/Medium/Hard)
- Random question selection per attempt
- Time-limited (configurable per job)
- Auto-save answers in React state
- Question navigation grid
- Mark/unmark questions
- Auto-submit on violations

#### Question Bank Structure
```sql
aptitude_questions
├── id (PK)
├── question_text
├── option_a
├── option_b
├── option_c
├── option_d
├── correct_answer ('A'|'B'|'C'|'D')
├── difficulty ('easy'|'medium'|'hard')
├── category ('logical'|'quantitative'|'verbal')
└── created_at
```

#### Attempt Management
```sql
aptitude_attempts
├── id (PK, UUID)
├── candidate_id (FK)
├── job_id (FK)
├── status ('started'|'submitted')
├── score (0-100)
├── starts_at (timestamp)
├── ends_at (timestamp, starts_at + duration)
└── submitted_at
```

#### Question Assignment
```sql
aptitude_attempt_questions
├── attempt_id (FK)
├── question_id (FK)
└── question_order (1, 2, 3...)
```

#### Answer Storage
```sql
aptitude_answers
├── attempt_id (FK)
├── question_id (FK)
├── selected_answer ('A'|'B'|'C'|'D')
├── is_correct (boolean)
└── answered_at
```

#### User Experience

**Start Flow:**
1. Click "Start Round" on `/applications`
2. POST `/api/aptitude/start` with jobId
3. Backend creates attempt, fetches N questions
4. Frontend receives questions (without correct answers)
5. Navigate to `/aptitude/round/:jobId`
6. Auto-enter fullscreen
7. Start countdown timer

**During Test:**
- Display one question at a time
- Select answer (radio button)
- Navigate: Previous/Next buttons
- Jump to question via navigator grid
- Clear selection option
- Auto-save state in React
- Timer displays MM:SS countdown
- Warning modal at 5 minutes remaining

**Security Features:**
- Fullscreen enforced (request on mount)
- Back button blocked (beforeunload event)
- Tab switch detected → auto-submit
- Window blur detected → auto-submit
- Right-click disabled (contextmenu prevented)
- Copy/paste disabled in exam area
- Proctoring active (see Proctoring section)

**Submit Flow:**
1. Manual submit: Click "Submit" button
2. Auto-submit: Timer reaches 0, or security violation
3. POST `/api/aptitude/submit` with all answers
4. Backend grades:
   - Compare each answer to correct_answer
   - Count correct answers
   - Calculate score: (correct / total) * 100
5. Store score in attempt and application
6. Show results modal:
   - Score: 85/100
   - Correct: 17/20
   - Pass/Fail status
7. Check for next round:
   - If DSA configured → redirect `/dsa/round/:jobId`
   - Else → redirect `/applications`

### 2. DSA Assessment

#### Overview
- Multi-problem coding assessment
- Data Structures & Algorithms focus
- C++ language (GNU C++17)
- Monaco Editor interface
- Judge0 CE for code execution
- Per-problem submission and locking
- Draft auto-save
- Test case validation

#### Problem Bank Structure
```sql
dsa_bank_problems
├── id (PK)
├── dataset_id (unique, e.g., 'two-sum')
├── title ('Two Sum')
├── difficulty ('easy'|'medium'|'hard')
├── problem_statement (markdown/html)
├── constraints (text)
├── boilerplate_cpp (starter code)
├── time_limit_ms (2000)
├── memory_limit_mb (256)
└── created_at
```

#### Test Cases
```sql
dsa_bank_test_cases
├── id (PK)
├── problem_id (FK)
├── test_order (1, 2, 3...)
├── input (text)
├── expected_output (text)
├── is_hidden (boolean)
└── explanation (text, for samples)
```

- **Public test cases**: Visible to candidate (2-3 samples)
- **Hidden test cases**: Used for final grading (5-10 cases)
- **Edge cases**: Boundary conditions, large inputs

#### Round Configuration
```sql
dsa_round_configs
├── id (PK)
├── job_id (FK, unique)
├── enabled (boolean)
├── published (boolean)
├── duration_minutes (60)
├── problem_count (3)
└── created_at
```

#### Config Problems (Join Table)
```sql
dsa_round_config_problems
├── config_id (FK)
├── problem_id (FK)
├── problem_order (1, 2, 3)
```

#### Attempt Management
```sql
dsa_round_attempts
├── id (PK, UUID)
├── candidate_id (FK)
├── config_id (FK)
├── status ('started'|'completed')
├── final_score (0-100, average of problems)
├── started_at
├── expires_at (started_at + duration)
└── completed_at
```

#### Redis Storage (Drafts & State)
```
Keys:
- dsa:round:{attemptId}:expiry → ISO timestamp
- dsa:round:{attemptId}:status → 'active'|'completed'
- dsa:round:{attemptId}:drafts → Hash map
  - {problemId}: sourceCode

TTL: Duration + 5 minutes buffer
```

#### Submission Tracking
```sql
dsa_round_submissions
├── id (PK)
├── attempt_id (FK)
├── problem_id (FK)
├── source_code (text)
├── is_final (boolean)
├── score (0-100)
├── test_results (JSONB)
├── execution_time_ms
├── memory_kb
└── submitted_at
```

#### User Experience

**Start Flow:**
1. Click "Start Round" → POST `/api/dsa/start`
2. Backend creates attempt, returns 3 problems
3. Navigate to `/dsa/round/:jobId`
4. Auto-enter fullscreen
5. Problems displayed as tabs
6. Code editor loads with boilerplate

**Interface Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  DSA Round             Timer: 59:23        [Submit All] │
├──────────────────┬──────────────────────────────────────┤
│ LEFT PANEL       │ RIGHT PANEL                          │
│                  │                                      │
│ [Prob 1] [2] [3] │  Language: C++ ▼                     │
│                  │  ┌────────────────────────────┐     │
│ Two Sum          │  │ #include <iostream>        │     │
│ Difficulty: Easy │  │ using namespace std;       │     │
│                  │  │                            │     │
│ Problem:         │  │ vector<int> twoSum(...) {  │     │
│ Given an array...│  │     // Your code here      │     │
│                  │  │ }                          │     │
│ Constraints:     │  └────────────────────────────┘     │
│ - 1 <= n <= 10^4 │                                      │
│                  │  Custom Input: ▼                     │
│ Sample Tests:    │  [1, 2, 3, 4]                        │
│ Input: [2,7,11]  │  9                                   │
│ Output: [0,1]    │                                      │
│                  │  [Run Code] [Submit]  Font: +  -     │
│                  │                                      │
│ ◀───drag────▶    │  Results:                            │
│                  │  ✓ Test 1: Passed (0.02s)            │
│                  │  ✓ Test 2: Passed (0.03s)            │
└──────────────────┴──────────────────────────────────────┘
```

**Writing Code:**
- Monaco Editor features:
  - Syntax highlighting
  - Auto-complete
  - Bracket matching
  - Code folding
  - Line numbers
  - Minimap (optional)
- Font size controls (+/-)
- Editor fullscreen toggle
- Auto-save draft every 30 seconds
- Draft saved to Redis

**Running Code:**
1. Write code in editor
2. Optionally provide custom input
3. Click "Run Code"
4. POST `/api/dsa/run`
5. Backend:
   - Validates attempt is active
   - Sends to Judge0 API
   - Polls for result
6. Display output in Results panel:
   - stdout
   - stderr
   - Execution time
   - Memory used
7. Does NOT count as submission
8. Can run unlimited times

**Submitting Solution:**
1. Click "Submit" for a problem
2. Confirmation modal (optional)
3. POST `/api/dsa/submit` with:
   - attemptId
   - problemId
   - sourceCode
4. Backend:
   - Fetch ALL test cases (public + hidden)
   - For each test case:
     - Submit to Judge0
     - Wait for result
     - Compare output (normalized)
   - Calculate score: (passed / total) * 100
   - Store submission with is_final=true
   - Store test_results JSON
5. Frontend displays detailed results:
   - Table of all test cases
   - Pass/fail per test
   - Expected vs actual output
   - Execution stats
6. Problem becomes LOCKED:
   - No more edits
   - No more submissions
   - Display "Submitted" badge
7. Move to next problem

**Switching Problems:**
- Click problem tab (1, 2, 3)
- Draft for current problem auto-saved
- Load draft for selected problem
- Each problem has independent state
- Submitted problems are view-only

**Finalization:**
- **Manual**: Click "Submit All" button
  - Submits all remaining problems with current code
  - Problems without code get score 0
- **Auto**: Timer reaches 0, tab switch, or window blur
  - Same as manual submit all
  - Instant finalization
- **Backend**:
  - Submit any unsubmitted problems
  - Calculate overall round score:
    - Average of all problem scores
    - Example: (100 + 80 + 60) / 3 = 80
  - UPDATE dsa_round_attempts:
    - status = 'completed'
    - final_score = 80
  - UPDATE applications:
    - dsa_score = 80
- **Navigation**:
  - Check rounds config for next online round
  - Redirect to next round or `/applications`

**Security Features:**
- Fullscreen enforced
- Back button blocked
- Tab switch → auto-submit ALL problems
- Window blur → auto-submit ALL problems
- Proctoring active throughout
- Draft changes lost if security violation (intentional)

#### Judge0 Integration

**API Workflow:**
1. **Create Submission**:
   ```http
   POST https://judge0-ce.p.rapidapi.com/submissions
   Content-Type: application/json
   
   {
     "language_id": 54,  // C++17
     "source_code": "base64_encoded_code",
     "stdin": "base64_encoded_input",
     "expected_output": "base64_encoded_output",
     "cpu_time_limit": 2.0,
     "memory_limit": 262144  // 256 MB in KB
   }
   ```

2. **Get Submission Token**:
   ```json
   {
     "token": "abc123-def456-..."
   }
   ```

3. **Poll for Result**:
   ```http
   GET /submissions/{token}?base64_encoded=true
   ```
   - Repeat until status.id != 1 or 2 (processing/in-queue)
   - Typically takes 0.5-3 seconds

4. **Parse Result**:
   ```json
   {
     "status": {
       "id": 3,
       "description": "Accepted"
     },
     "stdout": "base64_output",
     "stderr": "base64_error",
     "time": "0.023",  // seconds
     "memory": 2048    // KB
   }
   ```

**Status Codes:**
- 3: Accepted
- 4: Wrong Answer
- 5: Time Limit Exceeded
- 6: Compilation Error
- 7-12: Runtime Errors
- 13: Internal Error

**Output Normalization:**
- Trim trailing whitespace/newlines
- Convert `\r\n` → `\n`
- Case-sensitive comparison (unless specified)
- Floating point tolerance (if needed)

### 3. Coding Assessment (Legacy)

**Note**: Single-problem coding round, similar to DSA but simpler interface. Not actively used in wizard but supported for backwards compatibility.

Features:
- Single problem per round
- Tabbed interface (Description/Constraints/Samples)
- Code editor on right
- Run and submit
- Test case validation

---

## Proctoring & Security

### AI-Powered Proctoring System

#### Overview
The proctoring system uses a combination of browser event monitoring and computer vision to detect suspicious activity during online assessments.

#### Components

**1. Frontend Monitoring (React Hook: `useProctoring`)**
- Webcam access and capture
- Browser event listeners
- WebSocket client
- Frame upload scheduler

**2. Backend WebSocket Server**
- Real-time event streaming
- Session management
- Event storage
- Connection handling

**3. AI Service (Python)**
- OpenCV face detection
- YOLOv8 object detection
- Frame processing
- Risk evaluation (LLM-based)

#### Monitored Events

**Browser Events:**
- `visibilitychange`: Tab switch detection
- `blur`: Window focus loss
- `focus`: Window regained focus
- `copy`: Copy action
- `paste`: Paste action
- `contextmenu`: Right-click attempts
- `beforeunload`: Navigation attempts

**Computer Vision Events:**
- `FACE_ABSENT`: No face detected in frame
- `MULTIPLE_FACE`: More than one face detected
- `LOOKING_AWAY`: Gaze direction away from screen
- `PHONE_DETECTED`: Mobile device in frame
- `UNAUTHORIZED_PERSON`: Additional person detected

#### Proctoring Flow

**Session Initialization:**
```javascript
// Frontend
const { startProctoring, stopProctoring } = useProctoring();

useEffect(() => {
  startProctoring({
    jobId: job.id,
    roundType: 'APTITUDE',
    attemptId: attempt.id
  });
  
  return () => stopProctoring();
}, []);
```

**Backend Session Creation:**
```javascript
POST /api/proctoring/start
{
  "jobId": "uuid",
  "roundType": "APTITUDE",
  "attemptId": "uuid"
}

Response:
{
  "sessionId": "uuid",
  "status": "active"
}
```

**Frame Capture Loop:**
```javascript
// Capture frame every 5 seconds
setInterval(async () => {
  const videoElement = webcamRef.current;
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  
  const frameData = canvas.toDataURL('image/jpeg', 0.7); // Base64
  
  await axios.post('/api/proctoring/frame', {
    sessionId,
    frameData
  });
}, 5000);
```

**Frame Processing (Backend → AI Service):**
```python
# AI Service: /ai/proctoring/process-frame

def process_frame(frame_data: str) -> dict:
    # Decode base64
    img_bytes = base64.b64decode(frame_data.split(',')[1])
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Face detection (Haar Cascade)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    face_count = len(faces)
    
    # Gaze detection (simplified)
    looking_away = False
    if face_count == 1:
        (x, y, w, h) = faces[0]
        face_center_x = x + w // 2
        img_center_x = img.shape[1] // 2
        deviation = abs(face_center_x - img_center_x)
        if deviation > img.shape[1] * 0.3:  # 30% deviation
            looking_away = True
    
    # Object detection (YOLOv8) - phone detection
    model = YOLO('yolov8n.pt')
    results = model(img)
    phone_detected = False
    for r in results:
        for c in r.boxes.cls:
            if int(c) in [67, 73]:  # cell phone, laptop (COCO classes)
                phone_detected = True
    
    return {
        'face_count': face_count,
        'looking_away': looking_away,
        'phone_detected': phone_detected,
        'timestamp': datetime.utcnow().isoformat()
    }
```

**Event Creation:**
```javascript
// Backend
if (face_count === 0) {
  await pool.query(`
    INSERT INTO proctoring_events (session_id, event_type, metadata)
    VALUES ($1, 'FACE_ABSENT', $2)
  `, [sessionId, { face_count }]);
}

if (face_count > 1) {
  await pool.query(`
    INSERT INTO proctoring_events (session_id, event_type, metadata)
    VALUES ($1, 'MULTIPLE_FACE', $2)
  `, [sessionId, { face_count }]);
}
```

**Browser Event Handling:**
```javascript
// Frontend
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab switched or window minimized
    sendEvent('TAB_SWITCH', { timestamp: Date.now() });
    
    // Auto-submit assessment
    handleAutoSubmit('Tab switch detected');
  }
});

window.addEventListener('blur', () => {
  sendEvent('WINDOW_BLUR', { timestamp: Date.now() });
  handleAutoSubmit('Window lost focus');
});
```

#### Risk Evaluation

**Aggregation:**
```sql
SELECT event_type, COUNT(*) as count
FROM proctoring_events
WHERE session_id = $1
GROUP BY event_type
ORDER BY count DESC;
```

Example Result:
```
event_type       | count
-----------------+-------
TAB_SWITCH       | 2
LOOKING_AWAY     | 5
FACE_ABSENT      | 1
COPY_PASTE       | 1
```

**LLM-Based Evaluation:**
```python
# AI Service: /ai/proctoring/evaluate-risk

def evaluate_risk(summary: str) -> dict:
    prompt = f"""
    Analyze the following proctoring event summary and assess the risk level:
    
    {summary}
    
    Consider:
    - Number and type of violations
    - Pattern of behavior
    - Intent indicators
    
    Return JSON:
    {{
      "risk_score": 0-100,
      "risk_level": "Low"|"Medium"|"High",
      "reason": "Brief explanation"
    }}
    """
    
    response = openrouter_api(prompt, model='anthropic/claude-3.5-sonnet')
    result = parse_json(response)
    
    # Validate and return
    return {
        'risk_score': clamp(result['risk_score'], 0, 100),
        'risk_level': result['risk_level'],
        'reason': result['reason']
    }
```

Example Output:
```json
{
  "risk_score": 45,
  "risk_level": "Medium",
  "reason": "Multiple tab switches suggest potential reference lookup. 
             Looking away instances may indicate external assistance. 
             However, no severe violations like multiple faces. 
             Recommend manual review of submission."
}
```

**Storage:**
```sql
UPDATE proctoring_sessions
SET risk_score = 45,
    risk_level = 'Medium',
    summary = 'Generated summary...',
    evaluated_at = NOW()
WHERE id = $1;
```

#### Violation Handling

**Severity Levels:**
1. **Low Severity** (Warning, logged):
   - Single copy/paste
   - Brief looking away
   - Right-click attempt

2. **Medium Severity** (Auto-submit):
   - Tab switch
   - Window blur
   - Face absent (>5 seconds)

3. **High Severity** (Immediate auto-submit + flag):
   - Multiple faces detected
   - Phone in frame
   - Continuous violations

**Auto-Submit Logic:**
```javascript
const handleAutoSubmit = async (reason) => {
  if (autoSubmitInProgress) return;
  autoSubmitInProgress = true;
  
  console.warn('Auto-submit triggered:', reason);
  
  // For DSA: Submit all remaining problems
  if (roundType === 'DSA') {
    await submitAllProblems();
  }
  
  // For Aptitude: Submit current answers
  if (roundType === 'APTITUDE') {
    await submitAptitude();
  }
  
  // Log violation
  await axios.post('/api/proctoring/violation', {
    sessionId,
    reason,
    timestamp: Date.now()
  });
  
  // Show modal and redirect
  showViolationModal(reason);
  setTimeout(() => {
    navigate('/applications');
  }, 5000);
};
```

#### Recruiter View

**Proctoring Report:**
```
┌────────────────────────────────────────────────┐
│ Proctoring Report - John Doe                   │
│ Job: Software Engineer | Round: Aptitude       │
├────────────────────────────────────────────────┤
│ Risk Assessment                                │
│ ┌────────────┐                                 │
│ │  Risk: 45  │  Medium                         │
│ └────────────┘                                 │
│                                                │
│ Summary:                                       │
│ Multiple tab switches suggest potential        │
│ reference lookup. Looking away instances may   │
│ indicate external assistance.                  │
├────────────────────────────────────────────────┤
│ Event Timeline                                 │
│                                                │
│ 10:05:23 - Session started                     │
│ 10:05:45 - Face detected                       │
│ 10:12:10 - Looking away                        │
│ 10:15:32 - Tab switch ⚠                        │
│ 10:18:45 - Looking away                        │
│ 10:22:10 - Copy detected                       │
│ 10:28:55 - Tab switch ⚠                        │
│ 10:30:12 - Face absent (3s)                    │
│ 10:35:20 - Session ended                       │
├────────────────────────────────────────────────┤
│ Event Summary                                  │
│ - Tab Switches: 2                              │
│ - Looking Away: 5                              │
│ - Face Absent: 1                               │
│ - Copy/Paste: 1                                │
│ - Total Events: 9                              │
│                                                │
│ [Download Full Report] [Flag for Review]       │
└────────────────────────────────────────────────┘
```

#### Privacy & Ethics

**Privacy Measures:**
- Frames are NOT stored permanently (only processed)
- Only metadata stored (face_count, events)
- Candidate informed of proctoring before test
- Camera permission requested explicitly
- Can decline (but cannot take test)

**Ethical Considerations:**
- Bias detection in CV models (ongoing research)
- False positive handling (manual review available)
- Accessibility considerations (alternative arrangements for disabled)
- Transparency in evaluation criteria

---

## User Roles & Capabilities

### Candidate Role

**Profile Management:**
- Create and update profile
- Manage skills (primary/secondary)
- Set job preferences (roles, locations)
- Track years of experience

**Job Discovery:**
- Browse all published jobs
- Advanced search and filters
- View AI-powered recommendations
- Access detailed job descriptions

**Application Process:**
- Apply to jobs with resume upload
- Track application status
- View application history
- Download submitted resumes

**Assessments:**
- Take aptitude tests (MCQ)
- Complete DSA coding challenges
- Single-problem coding rounds
- View scores and results

**Dashboard:**
- View recent job postings
- See application statistics
- Quick access to recommendations
- Profile completion status

### Recruiter Role

**Profile Management:**
- Create recruiter profile
- Organization affiliation
- Contact information

**Job Management:**
- Create jobs via wizard or form
- Configure multi-round assessments
- Publish, close, or delete jobs
- Manage job lifecycle (draft → published → closed)

**Candidate Evaluation:**
- View all applications
- AI-generated resume scores
- Access detailed score breakdowns
- Resume preview and download

**Assessment Configuration:**
- Set aptitude difficulty and duration
- Select DSA problems from bank
- Configure test cases
- Set pipeline order (Aptitude first vs DSA first)

**Ranking & Selection:**
- AI-powered candidate ranking
- Multi-dimensional scoring (resume + aptitude + DSA + coding)
- Select top N candidates
- Schedule interview windows
- Send automated emails (shortlist/reject)

**Proctoring Review:**
- View proctoring reports
- Event timelines
- Risk assessments (AI-generated)
- Manual review and flagging

**Analytics:** (Future)
- Hiring funnel metrics
- Time-to-hire statistics
- Quality of hire tracking
- Assessment performance trends

---

## Technical Implementation

### Database Design

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('CANDIDATE', 'RECRUITER')),
  is_password_set BOOLEAN DEFAULT FALSE,
  google_id VARCHAR(255) UNIQUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

**candidate_profiles**
```sql
CREATE TABLE candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  years_of_experience INTEGER,
  primary_skills TEXT[],
  secondary_skills TEXT[],
  preferred_roles TEXT[],
  preferred_locations TEXT[],
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);
```

**recruiters**
```sql
CREATE TABLE recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX idx_recruiters_org ON recruiters(organization_id);
```

**jobs**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES recruiters(id),
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  type VARCHAR(50),
  requirements TEXT[],
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  experience_level VARCHAR(50),
  degree VARCHAR(100),
  responsibilities TEXT,
  preferred_qualifications TEXT[],
  
  -- Assessment Configuration
  aptitude_enabled BOOLEAN DEFAULT FALSE,
  aptitude_level VARCHAR(20) CHECK (aptitude_level IN ('easy', 'medium', 'hard')),
  aptitude_duration_minutes INTEGER,
  aptitude_question_count INTEGER,
  pipeline_first_round VARCHAR(20) DEFAULT 'APTITUDE' CHECK (pipeline_first_round IN ('APTITUDE', 'DSA')),
  
  -- Selection/Interview Window
  selection_lock_from TIMESTAMP,
  selection_lock_until TIMESTAMP,
  selection_mail_sent_at TIMESTAMP,
  
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_org ON jobs(organization_id);
```

**applications**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidate_profiles(id),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  resume_file_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'PENDING',
  stage VARCHAR(50) DEFAULT 'applied',
  next_round VARCHAR(20) CHECK (next_round IN ('APTITUDE', 'DSA', 'CODING')),
  
  -- AI-Generated Resume Scores
  resume_score INTEGER CHECK (resume_score >= 0 AND resume_score <= 100),
  resume_data JSONB,
  resume_summary TEXT,
  resume_score_breakdown JSONB,
  
  -- Assessment Scores
  aptitude_score INTEGER CHECK (aptitude_score >= 0 AND aptitude_score <= 100),
  dsa_score INTEGER CHECK (dsa_score >= 0 AND dsa_score <= 100),
  coding_score INTEGER CHECK (coding_score >= 0 AND coding_score <= 100),
  
  -- Ranking
  rank INTEGER,
  
  applied_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_rank ON applications(job_id, rank);
```

#### Aptitude Assessment Tables

**aptitude_questions**
```sql
CREATE TABLE aptitude_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_aptitude_difficulty ON aptitude_questions(difficulty);
CREATE INDEX idx_aptitude_category ON aptitude_questions(category);
```

**aptitude_attempts**
```sql
CREATE TABLE aptitude_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidate_profiles(id),
  job_id UUID REFERENCES jobs(id),
  status VARCHAR(20) CHECK (status IN ('started', 'submitted')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_aptitude_attempts_candidate ON aptitude_attempts(candidate_id);
CREATE INDEX idx_aptitude_attempts_job ON aptitude_attempts(job_id);
```

**aptitude_attempt_questions**
```sql
CREATE TABLE aptitude_attempt_questions (
  attempt_id UUID REFERENCES aptitude_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES aptitude_questions(id),
  question_order INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX idx_attempt_questions_order ON aptitude_attempt_questions(attempt_id, question_order);
```

**aptitude_answers**
```sql
CREATE TABLE aptitude_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES aptitude_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES aptitude_questions(id),
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_aptitude_answers_attempt ON aptitude_answers(attempt_id);
```

#### DSA Assessment Tables

**dsa_bank_problems**
```sql
CREATE TABLE dsa_bank_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  problem_statement TEXT NOT NULL,
  constraints TEXT,
  boilerplate_cpp TEXT,
  time_limit_ms INTEGER DEFAULT 2000,
  memory_limit_mb INTEGER DEFAULT 256,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dsa_problems_difficulty ON dsa_bank_problems(difficulty);
CREATE INDEX idx_dsa_problems_dataset ON dsa_bank_problems(dataset_id);
```

**dsa_bank_test_cases**
```sql
CREATE TABLE dsa_bank_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES dsa_bank_problems(id) ON DELETE CASCADE,
  test_order INTEGER NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dsa_test_cases_problem ON dsa_bank_test_cases(problem_id, test_order);
```

**dsa_round_configs**
```sql
CREATE TABLE dsa_round_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT FALSE,
  duration_minutes INTEGER DEFAULT 60,
  problem_count INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(job_id)
);

CREATE INDEX idx_dsa_configs_job ON dsa_round_configs(job_id);
```

**dsa_round_config_problems**
```sql
CREATE TABLE dsa_round_config_problems (
  config_id UUID REFERENCES dsa_round_configs(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES dsa_bank_problems(id),
  problem_order INTEGER NOT NULL,
  PRIMARY KEY (config_id, problem_id)
);

CREATE INDEX idx_config_problems_order ON dsa_round_config_problems(config_id, problem_order);
```

**dsa_round_attempts**
```sql
CREATE TABLE dsa_round_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidate_profiles(id),
  config_id UUID REFERENCES dsa_round_configs(id),
  status VARCHAR(20) CHECK (status IN ('started', 'completed')),
  final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
  started_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(candidate_id, config_id)
);

CREATE INDEX idx_dsa_attempts_candidate ON dsa_round_attempts(candidate_id);
CREATE INDEX idx_dsa_attempts_config ON dsa_round_attempts(config_id);
```

**dsa_round_submissions**
```sql
CREATE TABLE dsa_round_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES dsa_round_attempts(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES dsa_bank_problems(id),
  source_code TEXT NOT NULL,
  is_final BOOLEAN DEFAULT FALSE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  test_results JSONB,
  execution_time_ms INTEGER,
  memory_kb INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dsa_submissions_attempt ON dsa_round_submissions(attempt_id);
CREATE INDEX idx_dsa_submissions_final ON dsa_round_submissions(attempt_id, is_final);
```

#### Proctoring Tables

**proctoring_sessions**
```sql
CREATE TABLE proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidate_profiles(id),
  job_id UUID REFERENCES jobs(id),
  round_type VARCHAR(20) NOT NULL,
  attempt_id UUID NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High')),
  summary TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  evaluated_at TIMESTAMP
);

CREATE INDEX idx_proctoring_sessions_candidate ON proctoring_sessions(candidate_id);
CREATE INDEX idx_proctoring_sessions_job ON proctoring_sessions(job_id);
CREATE INDEX idx_proctoring_sessions_attempt ON proctoring_sessions(attempt_id);
```

**proctoring_events**
```sql
CREATE TABLE proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proctoring_events_session ON proctoring_events(session_id, occurred_at);
CREATE INDEX idx_proctoring_events_type ON proctoring_events(event_type);
```

### API Architecture

#### RESTful API Design

**Base URL**: `http://localhost:3000`

**Authentication Header**:
```
Authorization: Bearer <JWT_TOKEN>
```

#### Authentication Endpoints

```
POST /auth/register
Body: { email, password, role }
Response: { message, requiresVerification }

POST /auth/login
Body: { email, password }
Response: { token, user: { id, email, role, profileCompleted } }

POST /auth/google
Body: { credential, role }
Response: { token, user, isNewUser }

POST /auth/set-password
Body: { password }
Response: { message }

GET /auth/me
Response: { user: { id, email, role, profileCompleted } }

POST /auth/logout
Response: { message }
```

#### Candidate Endpoints

```
POST /api/candidates/profile
Body: { fullName, yearsOfExperience, primarySkills, secondarySkills, ... }
Response: { profile }

GET /api/candidates/profile
Response: { profile }

PATCH /api/candidates/profile
Body: { ...updates }
Response: { profile }
```

#### Recruiter Endpoints

```
POST /api/recruiters/profile
Body: { fullName }
Response: { profile }

GET /api/recruiters/profile
Response: { profile }
```

#### Job Endpoints

```
GET /api/jobs
Query: ?status=PUBLISHED&limit=20
Response: { jobs: [...] }

GET /api/jobs/:id
Response: { job, recruiterInfo, applicationCount }

POST /api/jobs
Body: { title, description, requirements, ... }
Response: { job }

PATCH /api/jobs/:id
Body: { ...updates }
Response: { job }

DELETE /api/jobs/:id
Response: { message }

GET /api/jobs/recommendations
Response: { recommendations: [{ jobId, jobTitle, matchScore, reason }] }
```

#### Application Endpoints

```
POST /api/applications
Body: FormData { jobId, resumeFile }
Response: { application }

GET /api/applications
Response: { applications: [...] }

PATCH /api/applications/:id
Body: { status, nextRound }
Response: { application }
```

#### Assessment Endpoints

```
POST /api/aptitude/start
Body: { jobId }
Response: { attemptId, endsAt, duration, questions }

POST /api/aptitude/submit
Body: { attemptId, answers: { questionId: 'A', ... } }
Response: { score, totalQuestions, correctAnswers }

POST /api/dsa/start
Body: { jobId }
Response: { attemptId, expiresAt, problems }

POST /api/dsa/draft
Body: { attemptId, problemId, sourceCode }
Response: { message }

POST /api/dsa/run
Body: { attemptId, problemId, sourceCode, customInput }
Response: { status, stdout, stderr, time, memory }

POST /api/dsa/submit
Body: { attemptId, problemId, sourceCode }
Response: { score, testResults: [...] }

POST /api/dsa/finalize
Body: { attemptId }
Response: { finalScore, problemScores }
```

#### Proctoring Endpoints

```
POST /api/proctoring/start
Body: { jobId, roundType, attemptId }
Response: { sessionId }

POST /api/proctoring/frame
Body: { sessionId, frameData }
Response: { processed }

POST /api/proctoring/event
Body: { sessionId, eventType, metadata }
Response: { logged }

POST /api/proctoring/evaluate
Body: { sessionId }
Response: { riskScore, riskLevel, reason }

WS /proctoring/ws
Real-time event streaming
```

#### Recruiter Scoring Endpoints

```
GET /api/recruiter/candidates/:jobId
Response: { candidates: [{ candidateId, scores, rank }] }

POST /api/recruiter/rank
Body: { jobId }
Response: { rankedCandidates: [...] }

POST /api/recruiter/select
Body: { jobId, topN, nextRound, schedule: { lockFrom, lockUntil } }
Response: { selectedCount, emailsSent }
```

### Frontend Architecture

#### Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx (role-based navigation)
│   │   ├── Header.jsx (breadcrumb, user menu)
│   │   └── DashboardLayout.jsx (wrapper with sidebar + header)
│   ├── ui/ (reusable UI components)
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Input.jsx
│   │   └── Badge.jsx
│   ├── wizard/ (multi-step forms)
│   │   ├── WizardStep.jsx
│   │   └── WizardNavigation.jsx
│   ├── proctoring/
│   │   ├── WebcamMonitor.jsx
│   │   └── ProctoringStatus.jsx
│   ├── RequireProfile.jsx (HOC for profile completion)
│   ├── ResumeScoreCard.jsx (score display)
│   └── ScoreBreakdown.jsx (detailed scores)
│
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx (role switcher)
│   ├── Profile.jsx
│   ├── Recommendations.jsx
│   ├── onboarding/
│   │   ├── CandidateOnboarding.jsx
│   │   └── RecruiterOnboarding.jsx
│   ├── jobs/
│   │   ├── Jobs.jsx (browse)
│   │   ├── JobDetails.jsx
│   │   ├── JobCreationWizard.jsx
│   │   └── CreateEditJob.jsx
│   ├── applications/
│   │   ├── CandidateApplications.jsx
│   │   └── RecruiterApplications.jsx
│   ├── aptitude/
│   │   └── CandidateAptitudeRound.jsx
│   ├── coding/
│   │   ├── CandidateDsaRound.jsx
│   │   └── CandidateCodingRound.jsx
│   ├── dashboard/
│   │   ├── CandidateDashboard.jsx
│   │   └── RecruiterDashboard.jsx
│   └── recruiter/
│       └── RecruiterScores.jsx
│
├── contexts/
│   └── AuthContext.jsx (global user state)
│
├── hooks/
│   └── useProctoring.js (proctoring logic)
│
├── services/
│   └── api.js (axios instance, interceptors)
│
├── layouts/
│   └── DashboardLayout.jsx (sidebar + header wrapper)
│
└── App.jsx (router configuration)
```

#### State Management Strategy

**Global State (Context API):**
- User authentication state
- User role and profile status
- Token management
- Logout functionality

**Local State (useState/useReducer):**
- Form inputs
- UI state (modals, dropdowns)
- Pagination
- Filters

**Server State (react-query - optional future enhancement):**
- API data caching
- Automatic refetching
- Optimistic updates
- Background sync

#### Routing Strategy

```javascript
// App.jsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
  <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
  
  {/* Onboarding (no sidebar) */}
  <Route path="/onboarding/candidate" element={<ProtectedRoute><CandidateOnboarding /></ProtectedRoute>} />
  <Route path="/onboarding/recruiter" element={<ProtectedRoute><RecruiterOnboarding /></ProtectedRoute>} />
  
  {/* Assessment (fullscreen, no sidebar) */}
  <Route path="/aptitude/round/:jobId" element={<ProtectedRoute><RequireProfile><CandidateAptitudeRound /></RequireProfile></ProtectedRoute>} />
  <Route path="/dsa/round/:jobId" element={<ProtectedRoute><RequireProfile><CandidateDsaRound /></RequireProfile></ProtectedRoute>} />
  
  {/* Dashboard routes (with sidebar) */}
  <Route element={<ProtectedRoute><RequireProfile><DashboardLayout /></RequireProfile></ProtectedRoute>}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/jobs" element={<Jobs />} />
    <Route path="/jobs/:id" element={<JobDetails />} />
    <Route path="/jobs/new" element={<JobCreationWizard />} />
    <Route path="/applications" element={<ApplicationsPage />} />
    <Route path="/recruiter/scores" element={<RecruiterScores />} />
    <Route path="/recommendations" element={<Recommendations />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
</Routes>
```

#### Route Guards

**PublicRoute:**
- Redirects authenticated users to dashboard
- Allows unauthenticated access

**ProtectedRoute:**
- Requires authentication (JWT token)
- Redirects to /login if not authenticated
- Checks if password is set (for OAuth users)

**RequireProfile:**
- Requires profile completion
- Redirects to appropriate onboarding if incomplete
- Allows access if profile completed

---

## Security & Authentication

### JWT Authentication

**Token Structure:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "CANDIDATE",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Token Lifecycle:**
- Access token: 1 hour expiry
- Refresh token: 7 days expiry (future enhancement)
- Stored in localStorage (consider httpOnly cookies for production)
- Sent in Authorization header: `Bearer <token>`

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 10
- Passwords never stored in plain text

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Validation:**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

### OAuth 2.0 (Google)

**Flow:**
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent screen
3. User grants permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access token
6. Backend fetches user profile from Google
7. Create or login user in database
8. Issue JWT token to frontend

**Scopes:**
- `openid`: OpenID Connect
- `profile`: Access to name, photo
- `email`: Access to email address

### API Security

**Rate Limiting:**
- Implement rate limiting per IP/user
- Prevent brute force attacks
- Use Redis for distributed rate limiting (future)

**Input Validation:**
- Sanitize all user inputs
- Validate data types and formats
- Protect against SQL injection (parameterized queries)
- Protect against XSS (escape HTML)

**CORS Configuration:**
```javascript
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**File Upload Security:**
- Validate file types (only PDF for resumes)
- Limit file size (10 MB)
- Store files outside webroot
- Generate unique filenames (UUID)
- Scan for malware (future)

### Assessment Security

**Exam Mode:**
- Fullscreen enforcement
- Navigation blocking (back button)
- Tab switch detection
- Context menu disabled
- Copy/paste detection

**Code Execution Sandboxing:**
- Judge0 CE runs in isolated Docker containers
- Time limits enforced (2 seconds per test case)
- Memory limits enforced (256 MB)
- No file system access
- No network access

**Proctoring:**
- Computer vision monitoring
- Event logging
- Risk assessment
- Violation handling

---

## Deployment & Infrastructure

### Development Environment

**Prerequisites:**
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

**Setup:**
```bash
# Clone repository
git clone <repo-url>
cd Autonomous-Recruitment-Ecosystem

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run init-db       # Initialize database schema
npm start             # Port 3000

# Frontend setup (separate terminal)
cd frontend
npm install
npm run dev           # Port 5173

# AI Service setup (separate terminal)
cd ai-service
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

**Environment Variables:**
```env
# Backend (.env)
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/hireflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# AI Service (.env)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Production Deployment

**Recommended Stack:**
- **Server**: Ubuntu 20.04+ LTS
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (Node.js), Systemd (Python)
- **Database**: PostgreSQL (managed service recommended)
- **Cache**: Redis (managed service recommended)
- **CDN**: CloudFlare (for static assets)
- **SSL**: Let's Encrypt (free certificates)

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name hireflow.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hireflow.example.com;

    ssl_certificate /etc/letsencrypt/live/hireflow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hireflow.example.com/privkey.pem;

    # Frontend (React build)
    location / {
        root /var/www/hireflow/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket (Proctoring)
    location /proctoring/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # AI Service
    location /ai {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**PM2 Configuration:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hireflow-backend',
    script: './src/index.js',
    instances: 'max',  // Cluster mode
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};

// Start: pm2 start ecosystem.config.js
// Monitor: pm2 monit
// Logs: pm2 logs
```

**Systemd Service (AI Service):**
```ini
[Unit]
Description=HireFlow AI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/hireflow/ai-service
ExecStart=/usr/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Scaling Considerations

**Horizontal Scaling:**
- Load balancer (Nginx/HAProxy) in front of backend instances
- Stateless backend design (JWT, no server sessions)
- Redis for shared session storage
- Database connection pooling

**Caching Strategy:**
- Redis for:
  - Session data
  - API response caching (5 min TTL for recommendations)
  - Draft code storage
  - Rate limiting counters

**Database Optimization:**
- Indexes on frequently queried columns
- Connection pooling (pg-pool)
- Read replicas for reporting queries (future)
- Partitioning large tables by date (future)

**CDN for Static Assets:**
- Serve React build from CDN
- Cache JS/CSS bundles
- Image optimization

---

## Future Enhancements

### Planned Features (Roadmap)

**Phase 1 (Current):**
- ✅ Multi-role authentication
- ✅ Job creation wizard
- ✅ AI-powered resume scoring
- ✅ Multi-round assessment pipeline
- ✅ Proctoring system
- ✅ Job recommendations

**Phase 2 (Q2 2026):**
- [ ] Video interviewing (integrated or via Zoom API)
- [ ] Collaborative coding interviews (live)
- [ ] Advanced analytics dashboard (funnel metrics)
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)

**Phase 3 (Q3 2026):**
- [ ] ATS integration (Greenhouse, Lever)
- [ ] Background check integration
- [ ] Offer management system
- [ ] E-signature for offer letters
- [ ] Employee onboarding portal

**Phase 4 (Q4 2026):**
- [ ] AI interviewer (LLM-based conversational interviews)
- [ ] Bias detection and mitigation
- [ ] Predictive analytics (quality of hire)
- [ ] Custom assessment builder (drag-and-drop)
- [ ] API for third-party integrations

### Technical Debt & Improvements

**Code Quality:**
- Increase test coverage (Jest/Vitest)
- Add E2E tests (Playwright/Cypress)
- Implement CI/CD pipeline (GitHub Actions)
- Code linting and formatting (ESLint, Prettier)

**Performance:**
- Implement React Query for server state
- Add service worker for offline support
- Optimize bundle size (code splitting)
- Implement lazy loading for routes
- Database query optimization

**Security:**
- Implement refresh tokens
- Add CSRF protection
- Rate limiting per endpoint
- Malware scanning for uploads
- Penetration testing

**Monitoring:**
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Logging aggregation (ELK stack)
- Uptime monitoring (Pingdom)
- User analytics (Google Analytics / Mixpanel)

**Documentation:**
- API documentation (Swagger/OpenAPI)
- Component storybook (Storybook.js)
- Architecture decision records (ADRs)
- Deployment runbook

---

## Conclusion

The **Autonomous Recruitment Ecosystem** represents a comprehensive, AI-powered solution to modern hiring challenges. By automating resume screening, providing intelligent job matching, and offering secure, proctored assessments, the platform significantly reduces time-to-hire while improving candidate quality and experience.

**Key Differentiators:**
1. **Hybrid AI Matching**: Combines rule-based and LLM-based algorithms for superior accuracy
2. **Comprehensive Assessment**: Multi-round pipeline with coding, aptitude, and future video rounds
3. **Advanced Proctoring**: CV-based monitoring with AI risk evaluation
4. **Recruiter Automation**: AI-powered ranking, automated email workflows, interview scheduling
5. **Candidate Experience**: Modern UI, real-time feedback, transparent evaluation

**Impact Metrics (Expected):**
- 70% reduction in resume screening time
- 50% reduction in time-to-hire
- 85%+ candidate-job match accuracy
- 90%+ assessment completion rate
- 95%+ proctoring violation detection

The platform is built with scalability, security, and extensibility in mind, positioning it for future enhancements including video interviews, predictive analytics, and ATS integrations.

---

**Project Status**: Active Development
**Last Updated**: February 2026
**Version**: 1.0.0
**License**: MIT (or proprietary - TBD)
**Contributors**: [Team/Organization Name]
