#!/bin/bash

echo "🧪 Testing Resume Scoring..."
echo ""

# Test with a sample resume
RESPONSE=$(curl -s -X POST http://localhost:8000/ai/resume/score \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Looking for a Full Stack Developer with 3+ years experience in React, Node.js, PostgreSQL, and REST APIs. Must have CS degree.",
    "required_skills": ["React", "Node.js", "PostgreSQL", "REST APIs"],
    "resume_text": "Chintan Kasundra\nEmail: chintan@example.com\nPhone: +91-1234567890\n\nExperience:\n- 4 years as Full Stack Developer\n- Expert in React, Node.js, Express\n- PostgreSQL database management\n- Built RESTful APIs\n\nEducation:\n Bachelor of Technology in Computer Science\n\nSkills: React, Node.js, PostgreSQL, MongoDB, Docker, Git",
    "resume_filename": "chintan.pdf"
  }')

echo "📊 Scoring Results:"
echo "$RESPONSE" | jq '{
  name: .full_name,
  email: .email,
  scores: .matching_scores,
  summary: .professional_summary
}'

echo ""
echo "✅ Test complete!"
