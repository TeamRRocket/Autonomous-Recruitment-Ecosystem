# Autonomous Recruitment Ecosystem (HireFlow)

A comprehensive AI-powered recruitment platform featuring autonomous candidate assessment, intelligent job matching, and real-time proctoring capabilities.

## 📁 Project Structure

```
Autonomous-Recruitment-Ecosystem/
├── docs/                          # Documentation
│   ├── main.md                    # Main architecture documentation
│   ├── flow.md                    # System flow diagrams
│   ├── structure.md               # Database structure
│   ├── startup.md                 # Startup guide
│   └── UI_OVERVIEW.md             # UI/UX documentation
├── backend/                       # Node.js/Express backend
│   ├── src/
│   │   ├── config/                # Database and Redis configuration
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Authentication & error handling
│   │   ├── modules/               # Feature modules (jobs, applications, etc.)
│   │   ├── routes/                # API routes
│   │   ├── scripts/               # Database setup & seeding scripts
│   │   ├── services/              # Business logic services
│   │   └── utils/                 # Utility functions
│   └── uploads/                   # User-uploaded files (resumes)
├── frontend/                      # React/Vite frontend
│   ├── src/
│   │   ├── assets/                # Static assets
│   │   ├── components/            # Reusable components
│   │   ├── contexts/              # React contexts
│   │   ├── hooks/                 # Custom hooks
│   │   ├── layouts/               # Layout components
│   │   ├── pages/                 # Page components
│   │   │   ├── auth/              # Authentication pages
│   │   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── jobs/              # Job management pages
│   │   │   ├── applications/      # Application pages
│   │   │   ├── aptitude/          # Aptitude test pages
│   │   │   ├── coding/            # Coding assessment pages
│   │   │   └── recruiter/         # Recruiter-specific pages
│   │   └── services/              # API service layer
│   └── public/                    # Public assets
├── ai-service/                    # Python/FastAPI AI service
│   ├── ai/
│   │   ├── api/                   # API routes
│   │   ├── config.py              # Centralized configuration
│   │   ├── feature_engineering/   # Feature extraction
│   │   ├── matching/              # Skill matching algorithms
│   │   ├── proctoring/            # Proctoring logic
│   │   ├── resume_ingestion/      # Resume parsing
│   │   ├── resume_normalization/  # Resume data normalization
│   │   ├── scoring/               # Scoring algorithms
│   │   └── utils/                 # Shared utilities
│   └── main.py                    # FastAPI application entry
└── datasets/                      # Training and seed data
    ├── aptitude_dataset.csv       # Aptitude questions
    ├── leetcode_dataset.csv       # DSA problems
    └── dsa_dataset.json           # Additional DSA data
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

### 🎯 Start All Services at Once (Recommended)

The easiest way to start all services:

```bash
# Make scripts executable (first time only)
chmod +x start.sh stop.sh status.sh

# Start all services
./start.sh

# Check service status (in another terminal)
./status.sh

# Stop all services (in another terminal or Ctrl+C)
./stop.sh
```

The `start.sh` script will:
- ✅ Check prerequisites
- ✅ Install dependencies if needed
- ✅ Start backend, frontend, and AI service concurrently
- ✅ Create log files in `logs/` directory
- ✅ Monitor services and provide health check commands

**Service URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- AI Service: http://localhost:8000

**Utility Scripts:**
- `./start.sh` - Start all services
- `./stop.sh` - Stop all services
- `./status.sh` - Check service status and health

**View Logs:**
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/ai-service.log
```

---

### Manual Setup (Alternative)

If you prefer to start services individually:

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
```

### AI Service Setup
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys
python main.py
```

### Database Initialization
```bash
cd backend
node src/scripts/initDb.js
node src/scripts/addProctoringTables.js
node src/scripts/seedAptitudeDataset.js
node src/scripts/seedDsaDataset.js
```

## 🔑 Key Features

### For Recruiters
- **AI-Powered Job Matching**: Intelligent candidate-job matching using hybrid ML algorithms
- **Comprehensive Assessment**: Multi-round evaluation (aptitude, coding, DSA)
- **Real-time Proctoring**: AI-based behavioral monitoring during assessments
- **Resume Intelligence**: Automated resume parsing and scoring
- **Application Management**: Track and manage candidate applications

### For Candidates
- **Smart Job Recommendations**: Personalized job suggestions based on skills and experience
- **Interactive Assessments**: Engaging aptitude tests and coding challenges
- **Real-time Feedback**: Instant scoring and performance insights
- **Profile Management**: Comprehensive candidate profile system

### AI Capabilities
- **Skill Matching**: Advanced skill normalization and semantic matching
- **Resume Parsing**: Extract structured data from PDF/DOCX resumes
- **Scoring Algorithms**: Multi-dimensional candidate evaluation
- **Proctoring AI**: Face detection, phone detection, behavior analysis
- **LLM Integration**: Claude 3.5 Sonnet for semantic analysis

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with pg driver
- **Cache**: Redis for session management
- **Authentication**: JWT with bcrypt
- **File Upload**: Multer
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React Context API
- **HTTP Client**: Axios

### AI Service
- **Framework**: FastAPI
- **ML Libraries**: 
  - OpenCV for computer vision
  - YOLOv8 for object detection
  - Ultralytics for model inference
- **LLM**: OpenRouter API (Claude 3.5 Sonnet)
- **Document Processing**: PyPDF2, python-docx

## 📊 Recent Optimizations

### AI Service Refactoring (March 2026)
- ✅ Eliminated 200+ lines of duplicate code
- ✅ Created centralized configuration management
- ✅ Unified LLM API client
- ✅ Extracted skill matching into dedicated module
- ✅ Improved code organization and maintainability

### Project Restructuring
- ✅ Organized documentation into `docs/` folder
- ✅ Consolidated authentication pages into `frontend/src/pages/auth/`
- ✅ Standardized dataset naming conventions
- ✅ Removed empty and redundant folders
- ✅ Comprehensive `.gitignore` for all services
- ✅ Cleaned up old resume uploads

## 📝 API Documentation

### Backend API
- Base URL: `http://localhost:3000/api`
- Authentication: Bearer token in Authorization header

### AI Service API
- Base URL: `http://localhost:8000`
- Health Check: `GET /health`
- Job Matching: `POST /match-jobs`
- Resume Scoring: `POST /ai/resume/score`
- Proctoring: 
  - Frame Processing: `POST /ai/proctoring/process-frame`
  - Risk Evaluation: `POST /ai/proctoring/evaluate-risk`

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Email verification
- Secure file upload validation
- SQL injection prevention
- XSS protection

## 📈 Performance Optimizations
- Redis caching for frequently accessed data
- Database connection pooling
- Lazy loading for frontend components
- Optimized resume parsing algorithms
- Efficient skill matching algorithms

## 🧪 Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI Service tests
cd ai-service
pytest
```

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is proprietary and confidential.

## 👥 Team
Developed by the HireFlow team

## 📞 Support
For issues and questions, please open an issue on the repository.

---

**Last Updated**: March 3, 2026
**Version**: 2.0.0
