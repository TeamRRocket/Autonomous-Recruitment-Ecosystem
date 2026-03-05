import fs from 'fs/promises';
import axios from 'axios';

const testResume = async () => {
  const fileBytes = await fs.readFile('uploads/resumes/resume-1772563955790-195580529.pdf');
  const payload = {
    job_description: 'Software Development Engineer - I (SDE-1) requiring Python, Java, JavaScript, React, Node.js, DSA',
    required_skills: ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'DSA'],
    resume_file_base64: fileBytes.toString('base64'),
    resume_filename: 'resume.pdf'
  };
  
  try {
    const response = await axios.post('http://localhost:8000/ai/resume/score', payload, { timeout: 60000 });
    const data = response.data;
    console.log('✓ Resume Score:', data.matching_scores.overall_resume_score);
    console.log('✓ Full name:', data.full_name);
    console.log('✓ Technical skills:', data.technical_skills.slice(0, 8).join(', '));
    console.log('✓ Score breakdown:', JSON.stringify(data.matching_scores, null, 2));
  } catch (error) {
    console.log('✗ Error:', error.response?.data || error.message);
  }
  process.exit();
};

testResume();
