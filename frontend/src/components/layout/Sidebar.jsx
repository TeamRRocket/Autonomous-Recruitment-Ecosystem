import React, { useState } from 'react';
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
    Sparkles,
    BarChart3,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const Sidebar = () => {
    const { user, profile, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const role = user?.role;

    const candidateLinks = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Find Jobs', path: '/jobs', icon: Briefcase },
        { name: 'My Applications', path: '/applications', icon: FileText },
        { name: 'AI Recommendations', path: '/recommendations', icon: Sparkles },
        { name: 'Profile', path: '/profile', icon: Users },
    ];

    const recruiterLinks = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Create Job', path: '/jobs/new', icon: Briefcase },
        { name: 'Applications', path: '/applications', icon: Users },
        { name: 'Candidate Scores', path: '/recruiter/scores', icon: BarChart3 },
    ];

    const links = role === 'RECRUITER' ? recruiterLinks : candidateLinks;

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.charAt(0).toUpperCase();

    const displayName = profile?.full_name || user?.email?.split('@')[0];

    return (
        <div className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-[68px]' : 'w-[250px]'}`}>
            {/* Logo Section */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                {!isCollapsed && (
                    <div className="flex items-center space-x-2 animate-fade-in">
                        <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold font-heading shadow-lg">
                            H
                        </div>
                        <span className="text-lg font-bold font-heading gradient-text">
                            HireFlow AI
                        </span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="h-8 w-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold font-heading shadow-lg mx-auto">
                        H
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border rounded-full p-1 shadow-lg transition-all duration-200 z-10"
            >
                {isCollapsed ? (
                    <ChevronRight size={16} className="text-sidebar-foreground" />
                ) : (
                    <ChevronLeft size={16} className="text-sidebar-foreground" />
                )}
            </button>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {!isCollapsed && (
                    <div className="mb-4 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Menu
                    </div>
                )}
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                                isActive
                                    ? 'text-sidebar-primary-foreground bg-sidebar-primary shadow-sm'
                                    : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                            }`
                        }
                        title={isCollapsed ? link.name : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon
                                    size={20}
                                    className={`${isCollapsed ? '' : 'mr-3'} transition-colors ${
                                        isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground'
                                    }`}
                                />
                                {!isCollapsed && <span>{link.name}</span>}
                                {isActive && !isCollapsed && (
                                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Section */}
            <div className={`p-3 m-3 mt-0 glass-card ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                <div className={`flex items-center ${isCollapsed ? 'mb-2' : 'mb-3'}`}>
                    <div className="relative">
                        <div className={`${isCollapsed ? 'h-10 w-10' : 'h-10 w-10'} rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold font-heading border border-sidebar-border`}>
                            {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-sidebar rounded-full"></div>
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{displayName}</p>
                            <div className="flex items-center mt-0.5">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    {role?.toLowerCase()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="grid grid-cols-2 gap-2">
                        <NavLink
                            to="/profile"
                            className="flex items-center justify-center py-2 px-3 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-lg text-[11px] font-medium text-sidebar-foreground transition-all border border-sidebar-border"
                        >
                            Profile
                        </NavLink>
                        <button
                            onClick={logout}
                            className="flex items-center justify-center py-2 px-3 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-[11px] font-medium text-destructive transition-all border border-destructive/20"
                        >
                            <LogOut size={12} className="mr-1.5" />
                            Logout
                        </button>
                    </div>
                )}

                {isCollapsed && (
                    <button
                        onClick={logout}
                        className="flex items-center justify-center p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-all border border-destructive/20 w-full"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
