import { pool } from './src/config/db.js';
import { processApplicationResume } from './src/modules/resume/resumeProcessing.service.js';

const reprocessAll = async () => {
  try {
    console.log('🔍 Finding applications with resumes...');
    
    const result = await pool.query(
      `SELECT id, candidate_id, job_id, resume_score, resume_file_path 
       FROM applications 
       WHERE resume_file_path IS NOT NULL
       ORDER BY created_at DESC`
    );

    if (result.rows.length === 0) {
      console.log('❌ No applications with resumes found');
      process.exit(0);
    }

    console.log(`📋 Found ${result.rows.length} application(s) with resumes\n`);

    for (const app of result.rows) {
      console.log(`Processing application ID: ${app.id}`);
      console.log(`  Current score: ${app.resume_score ?? 'NULL'}`);
      console.log(`  Resume file: ${app.resume_file_path}`);
      
      try {
        await processApplicationResume({ applicationId: app.id });
        
        // Check new score
        const updated = await pool.query(
          'SELECT resume_score FROM applications WHERE id = $1',
          [app.id]
        );
        
        console.log(`  ✅ New score: ${updated.rows[0]?.resume_score ?? 'NULL'}\n`);
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}\n`);
      }
    }

    console.log('🎉 All resumes reprocessed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

reprocessAll();
