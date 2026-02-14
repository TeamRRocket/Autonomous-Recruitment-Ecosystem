import sendEmail from '../../utils/email.js';

export const sendShortlistEmail = async ({ email, jobTitle, nextRound, date, time, duration, instructions }) => {
  const subject = `Next Round Invitation - ${jobTitle}`;
  const message = [
    `Congratulations! You have been shortlisted for the next round: ${nextRound}.`,
    '',
    `Date: ${date}`,
    `Time: ${time}`,
    `Duration: ${duration}`,
    '',
    `Instructions: ${instructions}`,
  ].join('\n');

  await sendEmail({ email, subject, message });
};

export const sendRejectionEmail = async ({ email, jobTitle }) => {
  const subject = `Application Update - ${jobTitle}`;
  const message = [
    'Thank you for taking the time to apply.',
    'After careful consideration, we will not be moving forward with your application at this stage.',
    'We appreciate your interest and encourage you to apply for future roles.',
  ].join('\n');

  await sendEmail({ email, subject, message });
};
