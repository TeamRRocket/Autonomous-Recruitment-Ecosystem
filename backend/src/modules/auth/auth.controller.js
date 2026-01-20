import authService from './auth.service.js';
import catchAsync from '../../utils/catchAsync.js';

class AuthController {
    signup = catchAsync(async (req, res, next) => {
        const { email, password, role } = req.body;
        const result = await authService.signup(email, password, role);

        res.status(201).json({
            status: 'success',
            message: result.message
        });
    });

    verifyEmail = catchAsync(async (req, res, next) => {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ status: 'fail', message: 'Token is required' });
        }
        const result = await authService.verifyEmail(token);

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    });

    login = catchAsync(async (req, res, next) => {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);

        res.status(200).json({
            status: 'success',
            token,
            data: { user }
        });
    });

    googleAuth = catchAsync(async (req, res, next) => {
        const { idToken, role } = req.body;
        const { user, token } = await authService.googleLogin(idToken, role);

        res.status(200).json({
            status: 'success',
            token,
            data: { user }
        });
    });

    setPassword = catchAsync(async (req, res, next) => {
        const { password } = req.body;
        const result = await authService.setPassword(req.user.id, password);

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    });
}

export default new AuthController();
