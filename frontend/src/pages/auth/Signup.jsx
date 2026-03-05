import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
    const [role, setRole] = useState('CANDIDATE');
    const { signup, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential, role);
            toast.success('Account created successfully!');
            navigate('/set-password');
        } catch (error) {
            toast.error(String(error));
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Signup Failed');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold font-heading gradient-text">Create Account</h2>
                    <p className="text-muted-foreground mt-2">Join HireFlow AI to get started</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRole('CANDIDATE')}
                                className={`p-4 rounded-xl border transition-all ${role === 'CANDIDATE'
                                        ? 'border-primary bg-primary/10 text-primary-foreground ring-2 ring-ring'
                                        : 'border-border bg-input text-muted-foreground hover:border-border/80'
                                    }`}
                            >
                                <div className="font-semibold">Candidate</div>
                                <div className="text-xs mt-1 opacity-70">Looking for jobs</div>
                            </button>
                            <button
                                onClick={() => setRole('RECRUITER')}
                                className={`p-4 rounded-xl border transition-all ${role === 'RECRUITER'
                                        ? 'border-primary bg-primary/10 text-primary-foreground ring-2 ring-ring'
                                        : 'border-border bg-input text-muted-foreground hover:border-border/80'
                                    }`}
                            >
                                <div className="font-semibold">Recruiter</div>
                                <div className="text-xs mt-1 opacity-70">Hiring talent</div>
                            </button>
                        </div>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-card text-muted-foreground">Sign up with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="circle"
                            size="large"
                            text="signup_with"
                            width="280"
                        />
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>Already have an account? <Link to="/login" className="text-primary hover:text-primary/80 font-medium">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
