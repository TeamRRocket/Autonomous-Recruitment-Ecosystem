import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Login success!');
            navigate('/');
        } catch (error) {
            toast.error(error.toString());
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Login success!');
            navigate('/');
        } catch (error) {
            toast.error(String(error));
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Login Failed');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold font-heading gradient-text">Welcome Back</h2>
                    <p className="text-muted-foreground mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full bg-input border border-border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full bg-input border border-border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full gradient-primary hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
                    >
                        Sign In
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="circle"
                            size="large"
                            width="280"
                        />
                    </div>
                </form>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Don't have an account? <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">Sign up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
