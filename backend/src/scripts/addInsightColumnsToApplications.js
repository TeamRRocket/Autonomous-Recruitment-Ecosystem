import { pool } from '../config/db.js';

const run = async () => {
    try {
        console.log('Adding insight columns to applications table...');
        
        await pool.query(`ALter TABLE applications ADD COLUMN IF NOT EXISTS total_score FLOAT;`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS overall_summary TEXT;`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS strengths JSONB;`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS gaps JSONB;`);
        
        console.log('Columns added successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
};

run();
