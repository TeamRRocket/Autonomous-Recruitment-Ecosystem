import { pool } from '../config/db.js';

const createTables = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing database schema...');

        // Enable UUID extension
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Create Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255),
                role VARCHAR(20) NOT NULL CHECK (role IN ('CANDIDATE', 'RECRUITER')),
                auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
                email_verified BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Users table checked/created.');

        // Create Email Verification Tokens Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                used BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('Email verification tokens table checked/created.');

        // Create Organizations Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                website VARCHAR(255),
                industry VARCHAR(100),
                size VARCHAR(50),
                location VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Organizations table checked/created.');

        // Create Candidate Profiles Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_profiles (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                full_name VARCHAR(255) NOT NULL,
                years_of_experience INTEGER,
                primary_skills TEXT[],
                secondary_skills TEXT[],
                skill_levels JSONB, 
                preferred_roles TEXT[],
                preferred_locations TEXT[],
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Candidate Profiles table checked/created.');

        // Create Recruiters Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS recruiters (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
                full_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Recruiters table checked/created.');

        // Create Jobs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
                organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                location VARCHAR(255),
                type VARCHAR(50), -- Full-time, Contract, etc.
                salary_range VARCHAR(100),
                requirements TEXT[],
                status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
                expires_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Jobs table checked/created.');

        // Aptitude round configuration on Job (schema evolution-safe)
        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS aptitude_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
        await client.query(
            `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS aptitude_level VARCHAR(16) CHECK (aptitude_level IN ('easy', 'medium', 'hard'));`
        );
        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS aptitude_duration_minutes INTEGER;`);
        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS aptitude_question_count INTEGER;`);
        console.log('Jobs aptitude config columns checked/created.');

        await client.query(
            `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pipeline_first_round VARCHAR(16) NOT NULL DEFAULT 'APTITUDE' CHECK (pipeline_first_round IN ('APTITUDE','DSA'));`
        );

        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selection_lock_from TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selection_mail_sent_at TIMESTAMP WITH TIME ZONE;`);
        await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selection_lock_until TIMESTAMP WITH TIME ZONE;`);
        console.log('Jobs pipeline config columns checked/created.');

        // Aptitude Questions Bank
        await client.query(`
            CREATE TABLE IF NOT EXISTS aptitude_questions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                question_text TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A','B','C','D')),
                difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
                topic VARCHAR(128),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Aptitude questions table checked/created.');

        // Candidate Aptitude Attempt
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_aptitude_attempts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE,
                score INTEGER,
                status VARCHAR(16) NOT NULL CHECK (status IN ('started','submitted','expired')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(job_id, candidate_id)
            );
        `);
        console.log('Candidate aptitude attempts table checked/created.');

        // Candidate Aptitude Responses (also used to lock questions at start by inserting rows with NULL selected_option)
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_aptitude_responses (
                attempt_id UUID NOT NULL REFERENCES candidate_aptitude_attempts(id) ON DELETE CASCADE,
                question_id UUID NOT NULL REFERENCES aptitude_questions(id) ON DELETE RESTRICT,
                selected_option VARCHAR(1) CHECK (selected_option IN ('A','B','C','D')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (attempt_id, question_id)
            );
        `);
        console.log('Candidate aptitude responses table checked/created.');

        // Create Interview Rounds Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS interview_rounds (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                round_name VARCHAR(255) NOT NULL,
                round_type VARCHAR(20) NOT NULL CHECK (round_type IN ('MCQ', 'CODING', 'INTERVIEW')),
                round_order INTEGER NOT NULL,
                duration_minutes INTEGER NOT NULL,
                num_questions INTEGER,
                difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')),
                passing_criteria JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Interview rounds table checked/created.');

        // Create Applications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                resume_file_path VARCHAR(500),
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(job_id, candidate_id)
            );
        `);
        console.log('Applications table checked/created.');

        await client.query(
            `ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage VARCHAR(32) NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied','shortlisted','rejected'));`
        );
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_round VARCHAR(16) CHECK (next_round IN ('APTITUDE','DSA'));`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_score INTEGER;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS aptitude_score INTEGER;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS dsa_score INTEGER;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS total_score INTEGER;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS rank INTEGER;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_data JSONB;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_summary TEXT;`);
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_score_breakdown JSONB;`);
        console.log('Applications workflow columns checked/created.');

        // Create Resumes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS resumes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                candidate_id UUID NOT NULL UNIQUE REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                file_url TEXT,
                parsed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Resumes table checked/created.');

        // Create Resume Scores Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS resume_scores (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                final_score FLOAT,
                score_breakdown JSONB,
                strengths JSONB,
                gaps JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Resume scores table checked/created.');

        // Create Coding Problems Table (DSA round)
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_problems (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                round_id UUID NOT NULL UNIQUE REFERENCES interview_rounds(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                statement TEXT NOT NULL,
                constraints TEXT,
                input_format TEXT,
                output_format TEXT,
                sample_input TEXT,
                sample_output TEXT,
                time_limit_seconds INTEGER DEFAULT 2,
                memory_limit_mb INTEGER DEFAULT 256,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Coding problems table checked/created.');

        // Create Coding Test Cases Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_test_cases (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
                input TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_sample BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Coding test cases table checked/created.');

        // Create Coding Submissions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS coding_submissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                problem_id UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                language_id INTEGER NOT NULL,
                source_code TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                total_tests INTEGER DEFAULT 0,
                passed_tests INTEGER DEFAULT 0,
                stdout TEXT,
                stderr TEXT,
                compile_output TEXT,
                time TEXT,
                memory INTEGER,
                judge0_token VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Coding submissions table checked/created.');

        // Create DSA Bank Problems first (referenced by other DSA tables)
        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_bank_problems (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                dataset_id VARCHAR(64) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
                problem_statement TEXT NOT NULL,
                constraints JSONB,
                boilerplate_cpp TEXT,
                time_limit_ms INTEGER DEFAULT 1000,
                memory_limit_mb INTEGER DEFAULT 256,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('DSA bank problems table checked/created.');

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_bank_test_cases (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                problem_id UUID NOT NULL REFERENCES dsa_bank_problems(id) ON DELETE CASCADE,
                test_order INTEGER NOT NULL,
                input TEXT NOT NULL,
                expected_output TEXT NOT NULL,
                is_hidden BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(problem_id, test_order)
            );
        `);
        console.log('DSA bank test cases table checked/created.');

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_configs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
                enabled BOOLEAN NOT NULL DEFAULT FALSE,
                num_questions INTEGER NOT NULL,
                difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
                time_limit_minutes INTEGER NOT NULL,
                published BOOLEAN NOT NULL DEFAULT FALSE,
                published_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_config_problems (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                config_id UUID NOT NULL REFERENCES dsa_round_configs(id) ON DELETE CASCADE,
                problem_id UUID NOT NULL REFERENCES dsa_bank_problems(id) ON DELETE RESTRICT,
                problem_order INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(config_id, problem_order),
                UNIQUE(config_id, problem_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_attempts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                config_id UUID NOT NULL REFERENCES dsa_round_configs(id) ON DELETE RESTRICT,
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                status VARCHAR(16) NOT NULL CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED')),
                started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE,
                time_taken_seconds INTEGER,
                final_score INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(job_id, candidate_id)
            );
        `);

        await client.query(`ALTER TABLE dsa_round_attempts ADD COLUMN IF NOT EXISTS problem_ids UUID[];`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_submissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                attempt_id UUID NOT NULL REFERENCES dsa_round_attempts(id) ON DELETE CASCADE,
                problem_id UUID NOT NULL REFERENCES dsa_bank_problems(id) ON DELETE RESTRICT,
                language_id INTEGER NOT NULL,
                source_code TEXT NOT NULL,
                is_final BOOLEAN NOT NULL DEFAULT FALSE,
                is_auto BOOLEAN NOT NULL DEFAULT FALSE,
                score INTEGER,
                passed_hidden INTEGER,
                total_hidden INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(attempt_id, problem_id, is_final)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_run_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                attempt_id UUID NOT NULL REFERENCES dsa_round_attempts(id) ON DELETE CASCADE,
                problem_id UUID NOT NULL REFERENCES dsa_bank_problems(id) ON DELETE RESTRICT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS dsa_round_anti_cheat_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                attempt_id UUID NOT NULL REFERENCES dsa_round_attempts(id) ON DELETE CASCADE,
                event_type VARCHAR(32) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create indexes for applications
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
        `);
        console.log('Application indexes created.');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_resume_scores_job_id ON resume_scores(job_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_resume_scores_candidate_id ON resume_scores(candidate_id);
        `);
        console.log('Resume indexes created.');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_interview_rounds_job_id ON interview_rounds(job_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_coding_test_cases_problem_id ON coding_test_cases(problem_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_coding_submissions_problem_id ON coding_submissions(problem_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_coding_submissions_candidate_id ON coding_submissions(candidate_id);
        `);
        console.log('Coding round indexes created.');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_bank_problems_difficulty ON dsa_bank_problems(difficulty);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_bank_test_cases_problem_id ON dsa_bank_test_cases(problem_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_round_config_problems_config_id ON dsa_round_config_problems(config_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_round_attempts_candidate_id ON dsa_round_attempts(candidate_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_round_submissions_attempt_id ON dsa_round_submissions(attempt_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_round_run_logs_attempt_id ON dsa_round_run_logs(attempt_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_dsa_round_anti_cheat_events_attempt_id ON dsa_round_anti_cheat_events(attempt_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_aptitude_questions_difficulty ON aptitude_questions(difficulty);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_candidate_aptitude_attempts_job_candidate ON candidate_aptitude_attempts(job_id, candidate_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_candidate_aptitude_responses_attempt_id ON candidate_aptitude_responses(attempt_id);
        `);

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

createTables();
