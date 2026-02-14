import nodemailer from 'nodemailer';

let cachedTransporter = null;
let cachedTransporterVerified = false;

const getTransporter = () => {
    if (cachedTransporter) return cachedTransporter;

    const hasSmtpConfig = Boolean(process.env.EMAIL_HOST);
    cachedTransporter = hasSmtpConfig
        ? nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT || 587),
            secure: String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })
        : nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

    return cachedTransporter;
};

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
        const transporter = getTransporter();
        if (!cachedTransporterVerified) {
            try {
                await transporter.verify();
                cachedTransporterVerified = true;
            } catch (e) {
                console.error('Email transporter verification failed:', e);
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: options.email,
            subject: options.subject,
            text: options.message
            // html: options.html // could add html support later
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
        if (info?.messageId) console.log(`MessageId: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to ${options?.email}:`, error);
        // Fallback to console log if email fails even with creds
        console.log('FALLBACK LINK LOG:', options.message);
    }
};

export default sendEmail;
