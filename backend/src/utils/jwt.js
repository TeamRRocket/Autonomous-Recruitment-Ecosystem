import jwt from 'jsonwebtoken';

const signToken = (id, role, isPasswordSet) => {
    return jwt.sign({ id, role, isPasswordSet }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

export { signToken, verifyToken };
