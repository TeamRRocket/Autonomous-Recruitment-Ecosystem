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
                resume_url VARCHAR(255),
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

        // Create indexes for applications
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
        `);
        console.log('Application indexes created.');

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

createTables();
