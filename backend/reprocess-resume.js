import { processApplicationResume } from './src/modules/resume/resumeProcessing.service.js';

const applicationId = '1a0043c9-eb02-4f33-b805-8c4631d7afd1';

console.log('Reprocessing application:', applicationId);

processApplicationResume({ applicationId })
  .then(() => {
    console.log('✓ Resume reprocessed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Error:', error.message);
    process.exit(1);
  });
