import { pool } from '../config/db.js';

async function seedSkills() {
    try {
        console.log('Updating job skills for better matching...');

        // Update Product Manager
        await pool.query(
            "UPDATE jobs SET required_skills = ARRAY['Agile', 'Scrum', 'Product Roadmap'] WHERE title = 'Product Manager'"
        );

        // Update Frontend Developer Intern
        await pool.query(
            "UPDATE jobs SET required_skills = ARRAY['React', 'JavaScript', 'CSS'] WHERE title = 'Frontend Developer Intern'"
        );

        // Update Data Scientist
        await pool.query(
            "UPDATE jobs SET required_skills = ARRAY['Python', 'Java', 'SQL'] WHERE title = 'Data Scientist'"
        );

        // Add a strong match job
        await pool.query(`
            INSERT INTO jobs (
                title, description, location, type, required_skills, status, recruiter_id, department, experience_level, responsibilities
            ) VALUES (
                'Software Engineer (C++)',
                'Join our core systems team building high-performance applications.',
                'Remote',
                'Full-time',
                ARRAY['cpp', 'oops', 'Linux', 'java'],
                'PUBLISHED',
                (SELECT id FROM recruiters LIMIT 1),
                'Engineering',
                'ENTRY',
                ARRAY['Code optimization', 'System design', 'Unit testing']
            )
        `);

        console.log('Seed completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seedSkills();
