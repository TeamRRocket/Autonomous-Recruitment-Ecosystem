import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Create Account</h2>
                    <p className="text-slate-400 mt-2">Join HireFlow AI to get started</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRole('CANDIDATE')}
                                className={`p-4 rounded-xl border transition-all ${role === 'CANDIDATE'
                                        ? 'border-blue-500 bg-blue-500/10 text-white ring-2 ring-blue-500/50'
                                        : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-semibold">Candidate</div>
                                <div className="text-xs mt-1 opacity-70">Looking for jobs</div>
                            </button>
                            <button
                                onClick={() => setRole('RECRUITER')}
                                className={`p-4 rounded-xl border transition-all ${role === 'RECRUITER'
                                        ? 'border-purple-500 bg-purple-500/10 text-white ring-2 ring-purple-500/50'
                                        : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-semibold">Recruiter</div>
                                <div className="text-xs mt-1 opacity-70">Hiring talent</div>
                            </button>
                        </div>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">Sign up with</span>
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

                <div className="mt-8 text-center text-sm text-slate-400">
                    <p>Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
