import { processApplicationResume } from './src/modules/resume/resumeProcessing.service.js';

const applicationId = '56b87e8e-06e9-4e96-a8c9-505ad7422685';

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
