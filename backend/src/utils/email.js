import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Check if using placeholder credentials
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_email')) {
        console.log('=================================================');
        console.log('EMAIL SERVICE [MOCK] - CHECK HERE FOR LINK');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('=================================================');
        return;
    }

    // Real Email Implementation
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: options.email,
            subject: options.subject,
            text: options.message
            // html: options.html // could add html support later
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback to console log if email fails even with creds
        console.log('FALLBACK LINK LOG:', options.message);
    }
};

export default sendEmail;
