import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    Settings,
    LogOut,
    Building2,
    CheckCircle2,
    Sparkles
} from 'lucide-react';


const Sidebar = () => {
    const { user, profile, logout } = useAuth();
    const role = user?.role;

    const candidateLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Find Jobs', path: '/jobs', icon: Briefcase }, // Assuming /jobs is the list
        { name: 'My Applications', path: '/applications', icon: FileText }, // Placeholder
        { name: 'AI Recommendations', path: '/recommendations', icon: Sparkles },
        { name: 'Profile', path: '/profile', icon: Users },
    ];

    const recruiterLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Create Job', path: '/jobs/new', icon: Briefcase },
        { name: 'Applications', path: '/applications', icon: Users },
    ];

    const links = role === 'RECRUITER' ? recruiterLinks : candidateLinks;

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.charAt(0).toUpperCase();

    const displayName = profile?.full_name || user?.email?.split('@')[0];

    return (
        <div className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 z-50 transition-all duration-300">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        H
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        HireFlow AI
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-4">
                <div className="mb-4 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Menu
                </div>
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'text-white bg-blue-600/10 border border-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.05)]'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon
                                    size={18}
                                    className={`mr-3 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                />
                                {link.name}
                                {isActive && (
                                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}


            </nav>

            {/* User Profile Summary & Logout */}
            <div className="p-4 m-3 mt-0 rounded-2xl bg-gradient-to-b from-slate-800/40 to-slate-900/60 border border-slate-800/50 shadow-xl overflow-hidden relative group">
                {/* Decorative element */}
                <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

                <div className="flex items-center mb-4 relative z-10">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center text-blue-400 text-sm font-bold border border-blue-500/30">
                            {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
                        <div className="flex items-center mt-0.5">
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{role?.toLowerCase()}</p>
                            <span className="mx-1.5 w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="text-[10px] text-blue-400/80 font-medium">Online</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 relative z-10">
                    <NavLink
                        to="/profile"
                        className="flex items-center justify-center py-2 px-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white transition-all border border-slate-700/30"
                    >
                        Profile
                    </NavLink>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center py-2 px-3 bg-red-500/5 hover:bg-red-500/10 rounded-lg text-[11px] font-medium text-red-400/80 hover:text-red-400 transition-all border border-red-500/10 hover:border-red-500/20"
                    >
                        <LogOut size={12} className="mr-1.5" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
