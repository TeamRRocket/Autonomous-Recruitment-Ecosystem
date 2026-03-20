import { pool } from '../config/db.js';

const addTechnicalInterviewTables = async () => {
  const client = await pool.connect();
  try {
    console.log('Adding technical interview tables...');

    // Add technical interview configuration to jobs table
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS technical_enabled BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS technical_duration_minutes INTEGER DEFAULT 30;
    `);
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS technical_question_count INTEGER DEFAULT 5;
    `);
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS technical_topics TEXT[] DEFAULT '{}';
    `);
    console.log('✓ Jobs table technical interview columns added');

    // Add technical_score to applications table
    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS technical_score INTEGER;
    `);
    console.log('✓ Applications table technical_score column added');

    // Create technical_questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS technical_questions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question_text TEXT NOT NULL,
        topic VARCHAR(255),
        difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
        expected_concepts TEXT[] DEFAULT '{}',
        time_limit_seconds INTEGER DEFAULT 300,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ technical_questions table created');

    // Create technical_interview_attempts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS technical_interview_attempts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED')),
        started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE,
        question_ids UUID[] NOT NULL,
        final_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, candidate_id)
      );
    `);
    console.log('✓ technical_interview_attempts table created');

    // Create technical_interview_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS technical_interview_responses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        attempt_id UUID NOT NULL REFERENCES technical_interview_attempts(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES technical_questions(id) ON DELETE CASCADE,
        answer TEXT,
        score FLOAT,
        feedback TEXT,
        correctness FLOAT,
        depth FLOAT,
        clarity FLOAT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(attempt_id, question_id)
      );
    `);
    console.log('✓ technical_interview_responses table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_technical_attempts_candidate 
      ON technical_interview_attempts(candidate_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_technical_attempts_job 
      ON technical_interview_attempts(job_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_technical_responses_attempt 
      ON technical_interview_responses(attempt_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_technical_questions_topic 
      ON technical_questions(topic, difficulty);
    `);
    console.log('✓ Indexes created');

    console.log('✅ Technical interview tables added successfully!');
  } catch (error) {
    console.error('Error adding technical interview tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
addTechnicalInterviewTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
