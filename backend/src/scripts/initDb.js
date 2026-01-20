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

        console.log('Database initialization completed successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

createTables();
