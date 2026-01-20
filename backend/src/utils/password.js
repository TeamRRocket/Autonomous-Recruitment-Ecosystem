import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

const comparePassword = async (candidatePassword, userPassword) => {
    return await bcrypt.compare(candidatePassword, userPassword);
};

export { hashPassword, comparePassword };
