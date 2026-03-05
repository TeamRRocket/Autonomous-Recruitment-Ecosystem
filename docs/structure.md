# Page Structure Documentation

This document describes the complete page structure for both Candidate and Recruiter roles in the Autonomous Recruitment Ecosystem.

## Table of Contents
- [Authentication & Onboarding Pages](#authentication--onboarding-pages)
- [Candidate Pages](#candidate-pages)
- [Recruiter Pages](#recruiter-pages)
- [Shared Pages](#shared-pages)
- [Assessment Pages](#assessment-pages)

---

## Authentication & Onboarding Pages

### `/login` - Login Page
**Component:** `frontend/src/pages/Login.jsx`

**Purpose:** User authentication via email/password or Google OAuth

**Layout:** No sidebar/header (public page)

**Page Structure:**
- Page Title: "Sign In"
- Email Input Field
- Password Input Field
- "Sign In" Primary Button
- Google OAuth Button
- "Don't have an account?" Link → `/signup`
- Forgot password option

**User Actions:**
- Login with email/password
- Login with Google OAuth
- Navigate to signup

---

### `/signup` - Signup Page
**Component:** `frontend/src/pages/Signup.jsx`

**Purpose:** New user registration with role selection

**Layout:** No sidebar/header (public page)

**Page Structure:**
- Page Title: "Create Account"
- Role Selection Toggle:
  - Candidate (default)
  - Recruiter
- Google Signup Button
- "Already have an account?" Link → `/login`

**User Actions:**
- Select role (Candidate/Recruiter)
- Sign up via Google OAuth → redirects to `/set-password`
- Navigate to login

---

### `/verify-email` - Email Verification
**Component:** `frontend/src/pages/VerifyEmail.jsx`

**Purpose:** Verify email with token

**Layout:** No sidebar/header

**Page Structure:**
- Status Display:
  - Loading spinner (verifying)
  - Success message
  - Error message
- "Return to Login" Button (on error)

**User Actions:**
- Automatic verification on page load
- Return to login on error

---

### `/set-password` - Password Setup
**Component:** `frontend/src/pages/SetPassword.jsx`

**Purpose:** Set password after OAuth signup

**Layout:** No sidebar/header (protected)

**Page Structure:**
- Page Title: "Set Your Password"
- Password Input Field
- Confirm Password Input Field
- Password Requirements Checklist:
  - Minimum 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character
- "Set Password" Button
- Logout Link

**User Actions:**
- Enter new password
- Confirm password
- Submit → logs out → redirects to `/login`

---

### `/onboarding/candidate` - Candidate Onboarding
**Component:** `frontend/src/pages/onboarding/CandidateOnboarding.jsx`

**Purpose:** Multi-step profile setup wizard for candidates

**Layout:** No sidebar/header (protected)

**Page Structure:**

**Wizard Steps:**

**Step 1: Basic Information**
- Full Name Input
- Years of Experience Input
- Navigation: "Next" Button

**Step 2: Experience & Skills**
- Primary Skills (comma-separated tags)
- Secondary Skills (comma-separated tags)
- Navigation: "Back" | "Next" Buttons

**Step 3: Preferences**
- Preferred Roles (tag input)
- Preferred Locations (tag input)
- Navigation: "Back" | "Complete Setup" Buttons

**User Actions:**
- Navigate between wizard steps
- Enter profile information
- Final submit → redirects to `/dashboard`

---

### `/onboarding/recruiter` - Recruiter Onboarding
**Component:** `frontend/src/pages/onboarding/RecruiterOnboarding.jsx`

**Purpose:** Minimal profile setup for recruiters

**Layout:** No sidebar/header (protected)

**Page Structure:**
- Page Title: "Complete Your Profile"
- Full Name Input
- "Complete Setup" Primary Button
- Logout Link

**User Actions:**
- Enter full name
- Submit profile → redirects to `/dashboard`

---

## Candidate Pages

### `/dashboard` - Candidate Dashboard
**Component:** `frontend/src/pages/dashboard/CandidateDashboard.jsx`

**Layout:** With sidebar and header

**Page Structure:**
- Page Header: "Dashboard"
- Search Bar (for jobs)
- Recent/Featured Jobs Section
  - Job Cards Grid:
    - Job Title
    - Company/Organization
    - Location
    - Job Type (Full-time/Part-time/Contract)
    - "View Details" Button
- Quick Stats Section:
  - Total Applications
  - Pending Reviews
  - Interviews Scheduled

**User Actions:**
- Search for jobs
- Click job card → navigate to `/jobs/:id`
- View job details

---

### `/jobs` - Browse Jobs
**Component:** `frontend/src/pages/jobs/Jobs.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Left Sidebar - Filters:**
- Location Filter (checkboxes)
- Experience Level Filter
- Degree Requirements Filter
- Job Types Filter
- Organizations Filter
- "Clear Filters" Button

**Main Content:**
- Page Header: "Find Jobs"
- Global Search Bar
- Active Filters Display (removable chips)
- Job Results Count
- Job Cards Grid:
  - Job Title
  - Organization Name
  - Location
  - Experience Required
  - Degree Required
  - Minimum Qualifications Preview
  - "Learn more" Link → `/jobs/:id`

**User Actions:**
- Apply filters
- Search jobs globally
- Remove active filters
- View job details

---

### `/jobs/:id` - Job Details
**Component:** `frontend/src/pages/jobs/JobDetails.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Job Header:**
- Job Title
- Organization Name
- Location
- Job Type
- Posted Date
- Expiry Date

**Job Content Sections:**
- Job Description
- Requirements List
- Responsibilities
- Preferred Qualifications
- Degree Requirements
- Experience Level

**Application Section (if not applied):**
- "Apply to this Job" Card
- Resume Upload Zone (PDF only)
- File Name Display
- "Upload Resume" Button
- "Apply" Primary Button

**Application Status (if already applied):**
- "Already Applied" Message
- Application Date
- Current Status Badge

**User Actions:**
- Read job details
- Upload resume (PDF)
- Submit application
- View application status

---

### `/applications` - Candidate Applications
**Component:** `frontend/src/pages/applications/CandidateApplications.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Page Header:**
- Title: "My Applications"
- Search Bar
- Status Filter Dropdown (All, Pending, Shortlisted, Rejected)

**Applications List:**
- Application Cards:
  - Job Title
  - Organization
  - Applied Date
  - Status Badge (Pending/Shortlisted/Rejected)
  - Next Round Badge (if applicable)
  - "View Resume" Button
  - "Start Round" Button (conditional display)
    - Visible only if:
      - Status = SHORTLISTED
      - Has next_round (APTITUDE/DSA)
      - Within interview window

**Empty State:**
- "No applications yet" message
- "Browse Jobs" CTA button

**User Actions:**
- Search applications
- Filter by status
- View uploaded resume
- Start assessment round (when available)
  - APTITUDE → navigate to `/aptitude/round/:jobId`
  - DSA → navigate to `/dsa/round/:jobId`

---

### `/recommendations` - AI Job Recommendations
**Component:** `frontend/src/pages/Recommendations.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Page Header:**
- Title: "AI-Powered Recommendations"
- Subtitle: "Jobs matched to your profile"

**Recommendations List:**
- Recommendation Cards:
  - Job Title
  - Organization Name
  - Match Score (0-100%)
  - Match Visualization (progress bar/circle)
  - AI Insights Section:
    - Icon
    - "Why this matches" explanation
  - "View Job" Button → `/jobs/:id`

**Empty State:**
- "No recommendations yet" message
- "Update your profile to get better matches"
- "Go to Profile" CTA button

**User Actions:**
- View match scores
- Read AI matching insights
- Navigate to job details
- Update profile for better matches

---

### `/profile` - Candidate Profile
**Component:** `frontend/src/pages/Profile.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Profile Header:**
- Avatar/Profile Picture
- Full Name
- Role Badge: "Candidate"
- "Edit Profile" Toggle Button

**Profile Details (View Mode):**
- Email (read-only)
- Years of Experience
- Primary Skills (tags)
- Secondary Skills (tags)
- Preferred Roles (tags)
- Preferred Locations (tags)
- Account Creation Date

**Profile Details (Edit Mode):**
- Full Name Input
- Years of Experience Input
- Primary Skills Input (comma-separated)
- Secondary Skills Input (comma-separated)
- Preferred Roles Input (comma-separated)
- Preferred Locations Input (comma-separated)
- "Save Changes" Button
- "Cancel" Button

**Account Actions:**
- "Sign Out" Button

**User Actions:**
- Toggle edit mode
- Update profile information
- Save changes
- Cancel editing
- Sign out

---

## Recruiter Pages

### `/dashboard` - Recruiter Dashboard
**Component:** `frontend/src/pages/dashboard/RecruiterDashboard.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Page Header:**
- Title: "Recruiter Dashboard"
- "Post New Job" Primary CTA Button → `/jobs/new`

**Search/Filter Section:**
- Search Input (filter by job title)
- Status Filter: All / Draft / Published / Closed

**Jobs List:**
- Job Cards/Table Rows:
  - Job Title
  - Location
  - Job Type
  - Posted Date
  - Status Badge (Draft/Published/Closed)
  - Application Count
  - Action Buttons (context-sensitive):
    - **Draft Status:**
      - "View" button
      - "Edit" button → `/jobs/:id/edit`
      - "Publish" button
      - "Delete" button
    - **Published Status:**
      - "View" button
      - "Edit" button
      - "Close" button (closes job for applications)
      - "View Applications" button → `/applications?job=:id`
    - **Closed Status:**
      - "View" button
      - "View Applications" button
      - "Delete" button

**Quick Stats:**
- Total Jobs Posted
- Active Jobs
- Total Applications Received
- Pending Reviews

**User Actions:**
- Search and filter jobs
- Create new job
- View job details
- Edit job
- Publish/close/delete jobs
- View applications per job

---

### `/jobs/new` - Create Job (Wizard)
**Component:** `frontend/src/pages/jobs/JobCreationWizard.jsx`

**Purpose:** Multi-step wizard for creating and configuring job postings

**Layout:** With sidebar and header

**Page Structure:**

**Wizard Header:**
- Title: "HireFlow Architect"
- Subtitle: "Create and Configure Your Job Posting"
- Step Indicator (1/4, 2/4, etc.)

**Step 1: Job Description**
- Job Title Input
- Location Input
- Job Type Dropdown (Full-time/Part-time/Contract/Remote)
- Experience Level Dropdown
- Degree Requirements Input
- Required Skills (tag input)
- Job Description (rich text editor)
- Responsibilities (rich text editor)
- Preferred Qualifications (list input)
- Navigation: "Save & Next" Button

**Step 2: Select Rounds**
- Available Assessment Rounds:
  - Aptitude Round (checkbox)
  - DSA Round (checkbox)
  - Coding Round (checkbox)
- Round Order Configuration
- Navigation: "Back" | "Save & Next"

**Step 3: Configure Rounds**
- For each enabled round, show configuration panel:

**Aptitude Configuration (if enabled):**
- Difficulty Level: Easy/Medium/Hard
- Duration (minutes) input
- Number of Questions input

**DSA Configuration (if enabled):**
- Number of Problems input
- Time Limit (minutes) input
- Problem Selection interface
- Test cases configuration

**Coding Configuration (if enabled):**
- Problem selection
- Test cases setup
- Time allocation

- Navigation: "Back" | "Save & Next"

**Step 4: Review & Publish**
- Job Details Summary
- Assessment Pipeline Summary
- Round Configuration Summary
- "Save as Draft" Button
- "Publish Job" Primary Button
- Navigation: "Back" Button

**User Actions:**
- Navigate between wizard steps
- Configure job details
- Select and configure assessment rounds
- Save draft or publish job
- Go back to edit previous steps

---

### `/jobs/:id/edit` - Edit Job (Legacy Form)
**Component:** `frontend/src/pages/jobs/CreateEditJob.jsx`

**Purpose:** Alternative single-page form for editing jobs

**Layout:** With sidebar and header

**Page Structure:**
- Page Title: "Edit Job" or "Create Job"
- Job Title Input
- Location Input
- Job Type Dropdown
- Deadline Date Picker
- Requirements (tag input with add/remove)
- Job Description Textarea
- Assessment Pipeline Section:
  - First Round Selector dropdown
  - Aptitude Toggle (enable/disable)
  - Aptitude Difficulty dropdown
  - Aptitude Duration input
  - Aptitude Question Count input
- "Save" Button
- "Cancel" Button

**User Actions:**
- Edit job fields
- Configure assessment pipeline
- Save changes
- Cancel editing

---

### `/applications` - Recruiter Applications
**Component:** `frontend/src/pages/applications/RecruiterApplications.jsx`

**Layout:** With sidebar and header

**Page Structure:**

**Page Header:**
- Title: "Applications"
- Total Applications Count

**Filters Section:**
- Search Input (candidate name/email)
- Status Filter Dropdown (All/Pending/Shortlisted/Rejected)
- Job Filter Dropdown (filter by specific job)
- Date Range Filter
- "Clear Filters" Button

**Applications Table:**
- Table Headers:
  - Candidate Name
  - Job Title
  - Applied Date
  - Resume Score
  - Status
  - Actions

- Table Rows:
  - Candidate Name
  - Job Title
  - Applied Date
  - Resume Score (with color coding)
  - Status Badge
  - Action Buttons:
    - "View Resume" (opens resume in new tab/modal)
    - "Shortlist" button (if pending)
    - "Reject" button (if pending)
    - Status already updated message

**Pagination:**
- Page numbers
- Items per page selector
- Total count display

**User Actions:**
- Search and filter applications
- View candidate resume
- Shortlist candidate
- Reject candidate
- Sort by different columns

---

### `/recruiter/scores` - Candidate Scores Dashboard
**Component:** `frontend/src/pages/recruiter/RecruiterScores.jsx`

**Purpose:** View comprehensive candidate scores with AI ranking and selection

**Layout:** With sidebar and header

**Page Structure:**

**Page Header:**
- Title: "Candidate Scores & Rankings"
- Job Selector Dropdown (select which job to view)

**Action Buttons:**
- "Rank Candidates" Primary Button
  - Triggers AI ranking algorithm
  - Updates rank order
- "Select Top Candidates" Button
  - Opens selection modal

**Candidates Table:**
- Table Headers:
  - Rank
  - Candidate Name
  - Resume Score
  - Aptitude Score
  - DSA Score
  - Coding Score
  - Overall Score
  - Actions

- Table Rows for Each Candidate:
  - Rank Number (1, 2, 3...)
  - Candidate Name
  - Score Blocks (color-coded):
    - **Resume Score Block:**
      - Score value (0-100)
      - "N/A" if not completed
    - **Aptitude Score Block:**
      - Score value
      - "N/A" if not completed
    - **DSA Score Block:**
      - Score value
      - "N/A" if not completed
    - **Coding Score Block:**
      - Score value
      - "N/A" if not completed
  - Overall/Average Score
  - "View Insights" Button

**View Insights Modal:**
- Modal Header: "Candidate Insights - [Name]"
- Tabs/Sections:
  - **Strengths:**
    - Bullet list of identified strengths
  - **Gaps:**
    - Bullet list of skill gaps
  - **Detailed Breakdown:**
    - Resume analysis
    - Skill matches
    - Experience relevance
    - Education relevance
- "Close" Button

**Select Top Candidates Modal:**
- Modal Header: "Select Top Candidates"
- Configuration Fields:
  - **Top N Input:** Number of candidates to select
  - **Next Round Dropdown:** APTITUDE or DSA
  - **Interview Window:**
    - Start Date/Time Picker
    - End Date/Time Picker
    - Or: Days from now + Time interval inputs
  - Preview of selected candidates (top N from ranked list)
- "Send Selection Emails" Primary Button
- "Cancel" Button

**User Actions:**
- Select job to view scores
- Rank candidates using AI
- View individual candidate insights
- Select top N candidates
- Configure interview window
- Send automated selection emails

---

## Shared Pages

### `/settings` - Settings
**Component:** Routes to `Profile.jsx`

**Layout:** With sidebar and header

**Note:** Currently a placeholder that redirects to Profile page. Same structure as Profile page.

---

## Assessment Pages

These pages run in full-screen "exam mode" outside the standard dashboard layout (no sidebar/header).

### `/aptitude/round/:jobId` - Aptitude Assessment
**Component:** `frontend/src/pages/aptitude/CandidateAptitudeRound.jsx`

**Purpose:** Multiple-choice aptitude test with proctoring

**Layout:** Full-screen exam mode (no sidebar/header)

**Page Structure:**

**Exam Header:**
- Attempt ID display
- Timer Display (countdown)
- Round Duration
- "Submit" Button

**Questions Section:**
- Question Number Indicator (e.g., "Question 1 of 20")
- Question Text
- Multiple Choice Options:
  - Option A (radio button)
  - Option B (radio button)
  - Option C (radio button)
  - Option D (radio button)
- "Clear Selection" Button
- Navigation:
  - "Previous Question" Button
  - "Next Question" Button

**Question Navigator Panel (sidebar/bottom):**
- Grid of Question Numbers
- Color coding:
  - Answered (green)
  - Current (blue)
  - Unanswered (gray)
- Click to jump to specific question

**Results Modal (after submission):**
- "Assessment Completed" Header
- Score Display
- Correct/Incorrect Count
- Pass/Fail Status
- "Continue" Button → navigates to next round or applications

**Exam Mode Behaviors:**
- Auto-enters fullscreen on mount
- Blocks browser back button
- Auto-submits on:
  - Timer reaches zero
  - Tab switch detected
  - Window loses focus
  - Browser visibility change
- Warning modals for suspicious activity

**User Actions:**
- Answer multiple-choice questions
- Navigate between questions
- Clear selection
- Jump to specific question
- Submit assessment manually
- Auto-submit on time/security violations

---

### `/dsa/round/:jobId` - DSA/Coding Round
**Component:** `frontend/src/pages/coding/CandidateDsaRound.jsx`

**Purpose:** Multi-problem DSA assessment with code editor

**Layout:** Full-screen exam mode with split view

**Page Structure:**

**Exam Header:**
- Round Title: "DSA Round"
- Timer Display (countdown)
- Total Duration
- "Submit All" Button (submits all remaining problems)

**Split View Layout:**

**Left Panel - Problem Statement:**
- Problem Number Tabs (Problem 1, 2, 3...)
- Problem Title
- Difficulty Badge
- Problem Statement Section (scrollable)
- Constraints Section
- Sample Test Cases:
  - Input
  - Expected Output
  - Explanation

**Right Panel - Code Editor:**
- Language Selector: C++ (GNU C++17)
- Code Editor (Monaco/CodeMirror):
  - Syntax highlighting
  - Line numbers
  - Auto-complete
  - Boilerplate code pre-loaded
- Custom Input Section (collapsible):
  - Custom test input textarea
- Action Buttons:
  - "Run Code" Button (with custom input)
  - "Submit Solution" Button (runs against all test cases)
- Font Size Controls (+/-)
- "Editor Fullscreen" Toggle

**Results Panel (below editor):**
- Test Case Results Table:
  - Test case number
  - Status (Passed/Failed/Error)
  - Input
  - Expected Output
  - Actual Output
  - Execution Time
  - Memory Used
- Compilation Errors (if any)
- Runtime Errors (if any)

**Problem Status Indicators:**
- Draft saved indicator
- Submission status per problem:
  - Not attempted (gray)
  - Draft (yellow)
  - Running (blue)
  - Submitted (green/red)

**Resizable Divider:**
- Drag handle between left and right panels
- Adjusts panel widths

**Exam Mode Behaviors:**
- Auto-enters fullscreen on mount
- Blocks browser back button
- Auto-submits ALL remaining problems on:
  - Timer reaches zero
  - Tab switch
  - Window loses focus
- Auto-saves code drafts every 30 seconds
- Locks submitted problems (no re-submission)

**Post-Submission:**
- Shows test case results
- Calculates score per problem
- Overall round score
- "Continue" Button → navigates to:
  - Next online round (if configured)
  - Applications page (if no more rounds)

**User Actions:**
- Switch between problems
- Write/edit code
- Run code with custom input
- Submit individual problem
- View test case results
- Submit all remaining problems
- Auto-submit on violations

---

### `/coding/round/:roundId` - Single Coding Problem
**Component:** `frontend/src/pages/coding/CandidateCodingRound.jsx`

**Purpose:** Single-problem coding assessment (legacy/alternative format)

**Layout:** Full-screen exam mode with split view

**Page Structure:**

**Exam Header:**
- Problem Title
- Timer Display
- "Submit" Button

**Split View (similar to DSA but single problem):**

**Left Panel - Tabs:**
- Description Tab
- Constraints Tab
- Sample Test Cases Tab

**Right Panel:**
- Code Editor (Monaco)
- Custom Test Input textarea
- Result Panel (below editor)
- Action Buttons:
  - "Run" Button
  - "Submit" Button
- Font Size Controls
- Editor Fullscreen Toggle

**Result Display:**
- Test case results
- Execution time
- Memory usage
- Pass/fail status

**User Actions:**
- Write and edit code
- Run with custom input
- Submit solution
- View results
- Toggle editor fullscreen

---

## Navigation Summary

### Candidate Navigation (Sidebar):
1. Dashboard → `/dashboard`
2. Find Jobs → `/jobs`
3. My Applications → `/applications`
4. AI Recommendations → `/recommendations`
5. Profile → `/profile`

### Recruiter Navigation (Sidebar):
1. Dashboard → `/dashboard`
2. Create Job → `/jobs/new`
3. Applications → `/applications`
4. Candidate Scores → `/recruiter/scores`
5. Profile → `/profile` (via header/account menu)

### Assessment Flow Navigation:
1. Candidate applies → `/jobs/:id`
2. Recruiter shortlists → sets next_round
3. Candidate starts round → `/applications` (Start Round button)
4. Assessment pages:
   - `/aptitude/round/:jobId`
   - `/dsa/round/:jobId`
5. After completion → next round or `/applications`

---

## Page Access Control

### Public Pages:
- `/login`
- `/signup`
- `/verify-email`

### Protected Pages (requires authentication):
- `/set-password`
- All `/onboarding/*` routes
- All dashboard and feature pages

### Role-Specific Pages:

**Candidate Only:**
- `/onboarding/candidate`
- `/recommendations`
- `/aptitude/round/:jobId`
- `/dsa/round/:jobId`
- `/coding/round/:roundId`
- Candidate version of `/applications`

**Recruiter Only:**
- `/onboarding/recruiter`
- `/jobs/new` (wizard)
- `/jobs/:id/edit`
- `/recruiter/scores`
- Recruiter version of `/applications`

### Profile Completion Required:
- All pages except:
  - Authentication pages
  - Onboarding pages
  - `/set-password`

---

## Component Architecture Summary

### Layout Components:
- **DashboardLayout** (`layouts/DashboardLayout.jsx`): Wraps most authenticated pages with sidebar + header
- **Sidebar** (`components/layout/Sidebar.jsx`): Role-based navigation menu
- **Header** (`components/layout/Header.jsx`): Top header with breadcrumb

### Route Guards:
- **ProtectedRoute**: Enforces authentication + password set
- **RequireProfile**: Enforces profile completion (onboarding done)
- **PublicRoute**: Redirects authenticated users away from auth pages

### Shared Components:
- **ResumeScoreCard**: Display candidate scores with breakdowns
- **ScoreBreakdown**: Detailed score visualization
- **RequireProfile**: HOC for profile requirement
- **UI Components**: Buttons, Cards, Modals, Forms (in components/ui/)
- **Wizard Components**: Multi-step form components (in components/wizard/)
- **Proctoring Components**: Camera and monitoring UI (in components/proctoring/)

---

## State Management

### Context Providers:
- **AuthContext** (`contexts/AuthContext.jsx`):
  - Current user state
  - User role (CANDIDATE/RECRUITER)
  - Authentication status
  - Login/logout methods
  - Profile completion status

### Custom Hooks:
- **useProctoring** (`hooks/useProctoring.js`):
  - Proctoring session management
  - WebSocket connection
  - Event tracking
  - Frame capture and upload

---

## Key Features per Page

### Advanced Features:

**Job Details Page:**
- PDF resume upload validation
- Application status tracking
- Real-time application count

**Aptitude Round:**
- Auto-fullscreen
- Countdown timer
- Auto-submit on violations
- Question navigation grid
- Progress tracking

**DSA Round:**
- Multi-problem interface
- Code execution via Judge0
- Draft auto-save
- Per-problem submission
- Test case validation
- Resizable panels
- Problem locking after submission

**Candidate Scores:**
- AI-powered ranking algorithm
- Multi-dimensional scoring
- Top-N candidate selection
- Automated email notifications
- Interview window scheduling
- Selection locking mechanism

**AI Recommendations:**
- Hybrid matching (rule-based + LLM)
- Skill normalization
- Semantic similarity analysis
- Match score calculation
- Personalized job suggestions

---

This structure document provides a comprehensive overview of all pages, their layouts, components, and user interactions in the Autonomous Recruitment Ecosystem.
