import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ toggleMobileSidebar }) => {
    return (
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Mobile Toggle & Context */}
            <div className="flex items-center">
                <button
                    className="md:hidden mr-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    onClick={toggleMobileSidebar}
                >
                    <Menu size={20} />
                </button>
                {/* Breadcrumb Placeholder or Page Title */}
                <nav className="hidden sm:flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-slate-500">App</span>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="mx-2 text-slate-600">/</span>
                                <span className="text-sm font-medium text-slate-200">Dashboard</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
        </header>
    );
};

export default Header;
