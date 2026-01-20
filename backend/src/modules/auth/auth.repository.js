import { pool } from '../../config/db.js';

class AuthRepository {
    async findUserByEmail(email) {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return res.rows[0];
    }

    async createUser(user) {
        const { email, passwordHash, role, authProvider, status, emailVerified } = user;
        const res = await pool.query(
            `INSERT INTO users (email, password_hash, role, auth_provider, status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [email, passwordHash, role, authProvider, status, emailVerified]
        );
        return res.rows[0];
    }

    async storeVerificationToken(userId, token, expiresAt) {
        await pool.query(
            'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );
    }

    async findToken(token) {
        const res = await pool.query(
            'SELECT * FROM email_verification_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        return res.rows[0];
    }

    async markTokenUsed(tokenId) {
        await pool.query('UPDATE email_verification_tokens SET used = TRUE WHERE id = $1', [tokenId]);
    }

    async verifyUserEmail(userId) {
        await pool.query(
            "UPDATE users SET email_verified = TRUE, status = 'ACTIVE' WHERE id = $1",
            [userId]
        );
    }

    async updateUser(userId, updates) {
        // Simple dynamic update helper specific to Auth needs if required, currently not needed for Phase 1 MVP explicitly
        // but verifyUserEmail covers the main state change.
    }

    async updateUserPassword(userId, passwordHash) {
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    }
}

export default new AuthRepository();
