#!/bin/bash

echo "🔍 Checking DSA Round Prerequisites..."
echo ""

# Check all active jobs
echo "📋 Active Jobs:"
psql -U chintankasundra -d hireflow -c "
SELECT 
  j.id, 
  j.title, 
  j.pipeline_first_round,
  j.status,
  COUNT(a.id) as app_count
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
WHERE j.status IN ('PUBLISHED', 'CLOSED')
GROUP BY j.id
ORDER BY j.created_at DESC
LIMIT 5;"

echo ""
echo "📊 Applications with Aptitude Status:"
psql -U chintankasundra -d hireflow -c "
SELECT 
  a.job_id,
  a.candidate_id,
  apt.id as aptitude_attempt_id,
  apt.status as aptitude_status,
  apt.submitted_at,
  dsa.id as dsa_attempt_id,
  dsa.status as dsa_status
FROM applications a
LEFT JOIN candidate_aptitude_attempts apt 
  ON apt.job_id = a.job_id AND apt.candidate_id = a.candidate_id
LEFT JOIN dsa_round_attempts dsa
  ON dsa.job_id = a.job_id AND dsa.candidate_id = a.candidate_id
ORDER BY a.created_at DESC
LIMIT 5;"

echo ""
echo "✅ Diagnostic check complete!"
