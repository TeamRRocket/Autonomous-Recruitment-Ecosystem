import { pool } from './src/config/db.js';
import { processApplicationResume } from './src/modules/resume/resumeProcessing.service.js';

(async () => {
  try {
    // Get the latest application with a resume
    const res = await pool.query(
      `SELECT id, resume_file_path FROM applications WHERE resume_file_path IS NOT NULL ORDER BY created_at DESC LIMIT 1`
    );
    
    if (res.rows.length === 0) {
      console.log('❌ No applications with resumes found');
      process.exit(1);
    }
    
    const app = res.rows[0];
    console.log('\n' + '='.repeat(60));
    console.log('🔧 Testing Resume Scoring with Detailed Logging');
    console.log('='.repeat(60));
    console.log(`Application ID: ${app.id}`);
    console.log(`Resume File: ${app.resume_file_path}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('📤 Sending resume to AI service for scoring...\n');
    
    await processApplicationResume({ applicationId: app.id });
    
    console.log('\n✅ Resume processing complete!');
    
    // Check the updated score
    const updated = await pool.query(
      `SELECT resume_score FROM applications WHERE id = $1`,
      [app.id]
    );
    
    console.log(`\n📊 Updated resume score: ${updated.rows[0].resume_score}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
