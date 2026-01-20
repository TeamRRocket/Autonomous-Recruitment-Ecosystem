import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import authRepository from './auth.repository.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import sendEmail from '../../utils/email.js';
import AppError from '../../utils/AppError.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    async signup(email, password, role) {
        // ... (this method doesn't return token so no change needed, but just verifying context)
        if (!email.endsWith('@gmail.com')) {
            throw new AppError('Only Gmail accounts are allowed', 400);
        }

        const existingUser = await authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        const passwordHash = await hashPassword(password);

        // Status Logic
        const status = 'PENDING_VERIFICATION';
        const emailVerified = false;

        const newUser = await authRepository.createUser({
            email,
            passwordHash,
            role: role || 'CANDIDATE',
            authProvider: 'LOCAL',
            status,
            emailVerified
        });

        // Verification Token
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await authRepository.storeVerificationToken(newUser.id, verifyToken, expiresAt);

        await sendEmail({
            email: newUser.email,
            subject: 'Verify your email for HireFlow AI',
            message: `Your verification token is: ${verifyToken} \n\n Or click link: ${process.env.FRONTEND_URL}/verify?token=${verifyToken}`
        });

        return { user: newUser, message: 'Verification email sent' };
    }

    async verifyEmail(token) {
        const tokenRecord = await authRepository.findToken(token);
        if (!tokenRecord) {
            throw new AppError('Token is invalid or expired', 400);
        }

        await authRepository.verifyUserEmail(tokenRecord.user_id);
        await authRepository.markTokenUsed(tokenRecord.id);

        return { message: 'Email verified successfully' };
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);

        if (!user || !(await comparePassword(password, user.password_hash))) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!user.email_verified) {
            throw new AppError('Please verify your email first', 401);
        }

        if (user.status !== 'ACTIVE') {
            throw new AppError('Account is not active', 403);
        }

        const token = signToken(user.id, user.role, true); // Local login implies password exists
        user.password_hash = undefined;

        return { user, token };
    }

    async googleLogin(idToken, requestedRole) {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, email_verified } = ticket.getPayload();

        if (!email.endsWith('@gmail.com')) {
            throw new AppError('Only Gmail accounts are allowed', 400);
        }

        let user = await authRepository.findUserByEmail(email);

        if (!user) {
            // If no requestedRole is provided, it means it's a LOGIN attempt for a non-existent user.
            if (!requestedRole) {
                throw new AppError('Account not found. Please sign up first.', 404);
            }

            // Create new Google User
            user = await authRepository.createUser({
                email,
                passwordHash: null,
                role: requestedRole,
                authProvider: 'GOOGLE',
                status: 'ACTIVE',
                emailVerified: true // Google emails are verified
            });
        } else {
            // Update provider if previously LOCAL? Or just allow login?
            // Ideally if existing local user, we might merge or reject. 
            // For simplicity, if auth_provider mismatch, we might reject or allow. 
            // Let's assume we allow logging in if email matches.
        }

        if (user.status === 'SUSPENDED') {
            throw new AppError('Account is suspended', 403);
        }

        const isPasswordSet = !!user.password_hash;
        const jwt = signToken(user.id, user.role, isPasswordSet);
        return { user, token: jwt };
    }

    async setPassword(userId, password) {
        const passwordHash = await hashPassword(password);
        await authRepository.updateUserPassword(userId, passwordHash);
        return { message: 'Password set successfully' };
    }
}

export default new AuthService();
