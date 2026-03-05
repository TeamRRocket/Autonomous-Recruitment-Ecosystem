import { pool } from '../config/db.js';

async function addMissingJobColumns() {
    const client = await pool.connect();
    try {
        console.log('Adding missing columns to jobs table...');

        // Add department column
        await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        `);
        console.log('✓ department column added/checked');

        // Add experience_level column
        await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
        `);
        console.log('✓ experience_level column added/checked');

        // Add responsibilities column (array of text)
        await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS responsibilities TEXT[];
        `);
        console.log('✓ responsibilities column added/checked');

        // Add degree column
        await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS degree VARCHAR(100);
        `);
        console.log('✓ degree column added/checked');

        // Add preferred_qualifications column (array of text)
        await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT[];
        `);
        console.log('✓ preferred_qualifications column added/checked');

        console.log('\n✅ All missing columns have been added successfully!');
    } catch (error) {
        console.error('❌ Error adding columns:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addMissingJobColumns();
