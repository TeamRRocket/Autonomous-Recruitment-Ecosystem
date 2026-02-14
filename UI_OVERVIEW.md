# UI Overview (Frontend)

This document inventories the UI of the project (React frontend) by route and page component.

- **Frontend entry router**: `frontend/src/App.jsx`
- **Shared authenticated layout**: `frontend/src/layouts/DashboardLayout.jsx`
- **Primary navigation** (desktop): `frontend/src/components/layout/Sidebar.jsx`
- **Top header**: `frontend/src/components/layout/Header.jsx`

## Global layout & navigation

### Dashboard shell (authenticated app)
- **Layout component**: `DashboardLayout`
- **Applies to routes**:
  - `/`, `/dashboard`, `/jobs`, `/jobs/new`, `/jobs/:id`, `/jobs/:id/edit`, `/applications`, `/recruiter/scores`, `/coding/round/:roundId`, `/recommendations`, `/profile`, `/settings`
- **Structure**:
  - **Left sidebar** (desktop only): role-based links
  - **Top header**: currently static breadcrumb placeholder
  - **Main content**: renders the active route via `<Outlet />`

### Sidebar navigation (role-based)
- **Component**: `frontend/src/components/layout/Sidebar.jsx`

#### Candidate menu
- **Dashboard**: `/dashboard`
- **Find Jobs**: `/jobs`
- **My Applications**: `/applications`
- **AI Recommendations**: `/recommendations`
- **Profile**: `/profile`

#### Recruiter menu
- **Dashboard**: `/dashboard`
- **Create Job**: `/jobs/new`
- **Applications**: `/applications`
- **Candidate Scores**: `/recruiter/scores`

### Route guards
- **ProtectedRoute**: requires auth; also forces password setup if `user.isPasswordSet === false`
- **RequireProfile**: requires onboarding completion (candidate vs recruiter)
- **PublicRoute**: blocks logged-in users from visiting `/login` and `/signup`

## Authentication & onboarding pages (no sidebar)

### `/login`
- **Component**: `frontend/src/pages/Login.jsx`
- **Purpose**: Sign in using email/password or Google OAuth
- **Key UI sections**:
  - Email + password inputs
  - Primary “Sign In” button
  - Google login button
  - Link to `/signup`
- **Primary actions**:
  - Login (sets session; redirects to `/`)

### `/signup`
- **Component**: `frontend/src/pages/Signup.jsx`
- **Purpose**: Create account via Google OAuth and select role
- **Key UI sections**:
  - Role toggle: Candidate vs Recruiter
  - Google signup
  - Link to `/login`
- **Primary actions**:
  - Signup via Google → redirects to `/set-password`

### `/verify-email?token=...`
- **Component**: `frontend/src/pages/VerifyEmail.jsx`
- **Purpose**: Verify email with token
- **Key UI sections**:
  - Status message (verifying / success / error)
  - “Return to Login” button on error

### `/set-password`
- **Component**: `frontend/src/pages/SetPassword.jsx`
- **Purpose**: Set a password after OAuth signup
- **Key UI sections**:
  - Password + confirm password
  - Password requirement checklist
  - “Set Password” button
- **Primary actions**:
  - Set password → logs out → redirects to `/login`

### `/onboarding/candidate`
- **Component**: `frontend/src/pages/onboarding/CandidateOnboarding.jsx`
- **Purpose**: Candidate profile onboarding wizard
- **Wizard steps**:
  - **Step 1**: Basic Info (name, years of experience)
  - **Step 2**: Experience & Skills (primary/secondary skills)
  - **Step 3**: Preferences (preferred roles, preferred locations)
- **Primary actions**:
  - Step navigation
  - Final submit creates profile → redirects to `/dashboard`

### `/onboarding/recruiter`
- **Component**: `frontend/src/pages/onboarding/RecruiterOnboarding.jsx`
- **Purpose**: Recruiter profile onboarding (minimal)
- **Key UI sections**:
  - Full name input
  - “Complete Setup” button
  - Logout link
- **Primary actions**:
  - Submit profile → redirects to `/dashboard`

## Assessment / exam pages (full-screen routes outside DashboardLayout)

These pages are mounted outside the standard dashboard shell (no sidebar/header) and implement an “exam mode” UX.

### `/aptitude/round/:jobId`
- **Component**: `frontend/src/pages/aptitude/CandidateAptitudeRound.jsx`
- **Purpose**: Candidate MCQ aptitude round
- **Key UI sections**:
  - Header: attempt id, duration, timer
  - List of questions with multiple-choice options
  - Submit button
  - Result panel after submission
- **Exam mode behaviors**:
  - Attempts fullscreen on mount
  - Blocks browser back navigation
  - Auto-submit when:
    - Timer reaches 0
    - Tab visibility changes away from the page
    - Window loses focus
- **Post-submit navigation**:
  - Uses rounds config to decide next:
    - If CODING exists → `/dsa/round/:jobId`
    - Else → `/applications`

### `/dsa/round/:jobId`
- **Component**: `frontend/src/pages/coding/CandidateDsaRound.jsx`
- **Purpose**: Candidate DSA/coding round with multiple problems
- **Key UI sections**:
  - Problem statement panel (left)
  - Editor + custom input + run results (right)
  - Problems list and per-problem submission state
- **Notable UX behaviors**:
  - Fullscreen attempt on mount
  - Back navigation blocked
  - Tab-switch / blur auto-submits **all remaining problems**
  - Countdown timer
  - Resizable split view with draggable divider
  - Per-problem drafts (stored client-side + autosave to backend)
  - Per-problem final submission:
    - After a problem is submitted it becomes locked (no edit/run/submit)
- **Post-completion navigation**:
  - Uses rounds config and order to decide next online round
  - If no next round → `/applications`

## Authenticated “dashboard” pages (inside DashboardLayout)

### `/` and `/dashboard`
- **Component**: `frontend/src/pages/Dashboard.jsx`
- **Purpose**: Role switch wrapper that renders:
  - Candidate dashboard (`CandidateDashboard`) or
  - Recruiter dashboard (`RecruiterDashboard`)

#### Candidate dashboard
- **Component**: `frontend/src/pages/dashboard/CandidateDashboard.jsx`
- **Purpose**: Entry view for candidates; highlights published jobs
- **Key UI sections**:
  - Search bar (navigates to a search route; note: route may not exist)
  - Job cards (title, type, location)
  - “View Details” links

#### Recruiter dashboard
- **Component**: `frontend/src/pages/dashboard/RecruiterDashboard.jsx`
- **Purpose**: Entry view for recruiters; manage recruiter’s jobs
- **Key UI sections**:
  - Search/filter input for recruiter jobs
  - List of jobs with status badges
  - Actions per job: View, Edit, Publish (draft), Close (published), Delete (closed)
  - “Post Job” CTA → `/jobs/new`

### `/jobs`
- **Component**: `frontend/src/pages/jobs/Jobs.jsx`
- **Purpose**: Browse published jobs (candidate-facing)
- **Key UI sections**:
  - Left filter sidebar (locations, experience, degree, job types, organizations)
  - Global search bar
  - Job cards with:
    - Title, org, location, experience, degree
    - Minimum qualifications preview
    - “Learn more” link → `/jobs/:id`

### `/jobs/:id`
- **Component**: `frontend/src/pages/jobs/JobDetails.jsx`
- **Purpose**: View a job’s detail page; candidate apply; recruiter view applicants & scores
- **Role-specific behavior**:
  - **Candidate**:
    - Shows apply section when job is published
    - Resume upload (PDF validation)
    - Apply button
    - If already applied, shows “already applied” message
  - **Recruiter**:
    - Shows a score summary list of candidates (resume/aptitude/dsa/coding)
    - Shows applicants list with status dropdown and resume link

### `/jobs/new`
- **Component**: `frontend/src/pages/jobs/JobCreationWizard.jsx`
- **Purpose**: Recruiter job creation wizard (“HireFlow Architect”)
- **Wizard steps**:
  - Step 1: Job description
  - Step 2: Select rounds
  - Step 3: Configure rounds
  - Step 4: Review & publish
- **Key behaviors**:
  - Saves job draft and rounds draft via API
  - Publishes job at final step
  - Updates aptitude config + pipeline settings on the job record

### `/jobs/:id/edit`
- **Component**: `frontend/src/pages/jobs/CreateEditJob.jsx`
- **Purpose**: Alternate job create/edit form (non-wizard)
- **Key UI sections**:
  - Job title, location/type, deadline
  - Requirements tag input (add/remove)
  - Description
  - Assessment pipeline config:
    - First round selector
    - Aptitude enable + difficulty + duration + question count

### `/applications`
- **Component**: Route-level wrapper `ApplicationsPage` in `App.jsx`
- **Purpose**: Role-based applications view
  - Recruiter → `RecruiterApplications`
  - Candidate → `CandidateApplications`

#### Candidate applications
- **Component**: `frontend/src/pages/applications/CandidateApplications.jsx`
- **Purpose**: Candidate’s application tracker + “Start Round” launcher
- **Key UI sections**:
  - Search + filter by status
  - Application cards with status
  - Resume “view” button
  - Start Round button (only if shortlisted, correct next_round, and within interview window)
- **Round launch behavior**:
  - If next_round = APTITUDE → navigates to `/aptitude/round/:jobId`
  - If next_round = DSA/CODING → navigates to `/dsa/round/:jobId`

#### Recruiter applications
- **Component**: `frontend/src/pages/applications/RecruiterApplications.jsx`
- **Purpose**: Recruiter table view of applications across jobs
- **Key UI sections**:
  - Filters: search, status, job
  - Applications table:
    - Candidate, job, applied date, status, action buttons
  - Actions:
    - View resume
    - Shortlist / Reject

### `/recruiter/scores`
- **Component**: `frontend/src/pages/recruiter/RecruiterScores.jsx`
- **Purpose**: Recruiter score dashboard + AI ranking + selection email flow
- **Key UI sections**:
  - Select a job
  - Buttons:
    - Rank Candidates
    - Select (opens modal)
  - Candidate rows with score blocks (resume, aptitude, DSA, coding)
  - “View Insights” modal (strengths, gaps, breakdown)
  - “Select” modal:
    - Top N
    - First round label
    - Interview date/day
    - Time interval
    - Sends selection emails & locks selection during interview window

### `/coding/round/:roundId`
- **Component**: `frontend/src/pages/coding/CandidateCodingRound.jsx`
- **Purpose**: Single-problem coding round (separate from DSA multi-problem round)
- **Key UI sections**:
  - Left tabs: description/constraints/samples
  - Right: code editor, testcase input, result panel
  - Run and Submit buttons
  - Editor font size controls + editor fullscreen toggle

### `/recommendations`
- **Component**: `frontend/src/pages/Recommendations.jsx`
- **Purpose**: Candidate AI job recommendations list
- **Key UI sections**:
  - Recommendation cards with match score and “AI insights” reason
  - Click card navigates to `/jobs/:jobId`
  - Empty state prompts to update profile

### `/profile` and `/settings`
- **Component**: `frontend/src/pages/Profile.jsx` (settings is a placeholder route pointing to same page)
- **Purpose**: Candidate/Recruiter profile viewer + editor
- **Key UI sections**:
  - Avatar + name + role
  - Edit toggle → shows editable inputs
  - Candidate-specific inputs:
    - Preferred roles
    - Primary skills, secondary skills (comma-separated)
  - Recruiter-specific inputs:
    - Job title / role-in-company
  - Save/cancel buttons
  - Sign out

## Additional / legacy UI pages (present in repo but not wired in `App.jsx`)

These components exist but do not appear to be registered as routes in `frontend/src/App.jsx` (as of current code).

### `RecruiterJobRanking`
- **Component**: `frontend/src/pages/RecruiterJobRanking.jsx`
- **Purpose**: Older recruiter ranking UI (rank + select Top-N) using `ResumeScoreCard`
- **Route status**: Not wired in `App.jsx`

### `RecruiterCodingBuilder`
- **Component**: `frontend/src/pages/coding/RecruiterCodingBuilder.jsx`
- **Purpose**: Recruiter tool to attach a coding problem to a CODING round and define test cases
- **Route status**: Not wired in `App.jsx` (may be legacy)

## Candidate & recruiter primary user flows

### Candidate: signup → onboarding → apply → rounds
- **Signup**: `/signup` → Google OAuth → `/set-password`
- **Login**: `/login`
- **Onboarding**: `/onboarding/candidate`
- **Browse jobs**: `/jobs` → `/jobs/:id`
- **Apply**: upload resume PDF on `/jobs/:id`
- **Track application**: `/applications`
- **Start round** (when shortlisted):
  - Aptitude: `/aptitude/round/:jobId`
  - DSA: `/dsa/round/:jobId`
- **After round**:
  - Redirect to next configured online round if exists
  - Otherwise redirect to `/applications`

### Recruiter: onboarding → create job → review candidates → rank/select
- **Onboarding**: `/onboarding/recruiter`
- **Create job**:
  - Wizard: `/jobs/new`
  - Or legacy form: `/jobs/:id/edit`
- **Publish job**: wizard publish step or dashboard publish action
- **Review applications**: `/applications`
- **View scores and rank**: `/recruiter/scores`
- **Select top candidates**: selection modal in `/recruiter/scores` sends emails and sets interview window

