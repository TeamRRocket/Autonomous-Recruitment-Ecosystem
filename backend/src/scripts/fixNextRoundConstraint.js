import { pool } from '../config/db.js';

/**
 * Fix next_round constraint to allow TECHNICAL and INTERVIEW rounds
 */
const fixNextRoundConstraint = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting next_round constraint fix...');
    
    await client.query('BEGIN');

    // Drop the old constraint
    console.log('Dropping old constraint...');
    await client.query(`
      ALTER TABLE applications 
      DROP CONSTRAINT IF EXISTS applications_next_round_check;
    `);

    // Add new constraint with TECHNICAL and INTERVIEW
    console.log('Adding new constraint with TECHNICAL and INTERVIEW...');
    await client.query(`
      ALTER TABLE applications 
      ADD CONSTRAINT applications_next_round_check 
      CHECK (next_round IN ('APTITUDE', 'DSA', 'TECHNICAL', 'INTERVIEW'));
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully updated next_round constraint!');
    console.log('   Allowed values: APTITUDE, DSA, TECHNICAL, INTERVIEW');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing constraint:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

fixNextRoundConstraint()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
