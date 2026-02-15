import { pool } from '../config/db.js';

const addProctoringTables = async () => {
    const client = await pool.connect();
    try {
        console.log('Adding proctoring tables to database schema...');

        // Create Proctoring Sessions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS proctoring_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                round_type VARCHAR(16) NOT NULL CHECK (round_type IN ('APTITUDE', 'DSA')),
                attempt_id UUID NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP WITH TIME ZONE,
                status VARCHAR(16) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(attempt_id, round_type)
            );
        `);
        console.log('✓ Proctoring sessions table created.');

        // Create Proctoring Events Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS proctoring_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id UUID NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
                event_type VARCHAR(32) NOT NULL CHECK (event_type IN (
                    'FACE_ABSENT', 'MULTIPLE_FACE', 'LOOKING_AWAY', 'PHONE_DETECTED',
                    'TAB_SWITCH', 'WINDOW_BLUR', 'COPY_PASTE'
                )),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Proctoring events table created.');

        // Create Proctoring Aggregated Summaries Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS proctoring_aggregated_summaries (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id UUID NOT NULL UNIQUE REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
                total_no_face INTEGER DEFAULT 0,
                total_multiple_face INTEGER DEFAULT 0,
                total_looking_away INTEGER DEFAULT 0,
                total_tab_switch INTEGER DEFAULT 0,
                total_window_blur INTEGER DEFAULT 0,
                total_copy_paste INTEGER DEFAULT 0,
                total_phone_detected INTEGER DEFAULT 0,
                longest_looking_away_seconds INTEGER DEFAULT 0,
                risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
                risk_level VARCHAR(16) CHECK (risk_level IN ('Low', 'Medium', 'High')),
                llm_reason TEXT,
                llm_evaluated_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Proctoring aggregated summaries table created.');

        // Extend Applications Table
        await client.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS proctoring_risk_score INTEGER;
        `);
        await client.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS proctoring_risk_level VARCHAR(16);
        `);
        await client.query(`
            ALTER TABLE applications 
            ADD COLUMN IF NOT EXISTS proctoring_reason TEXT;
        `);
        console.log('✓ Applications table extended with proctoring columns.');

        // Create Indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_candidate 
            ON proctoring_sessions(candidate_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_attempt 
            ON proctoring_sessions(attempt_id, round_type);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_proctoring_events_session 
            ON proctoring_events(session_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_proctoring_events_type 
            ON proctoring_events(event_type);
        `);
        console.log('✓ Proctoring indexes created.');

        console.log('\n✅ Proctoring tables added successfully!');
    } catch (error) {
        console.error('❌ Error adding proctoring tables:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

addProctoringTables();
