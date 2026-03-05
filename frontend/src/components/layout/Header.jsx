import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ toggleMobileSidebar }) => {
    return (
        <header className="h-16 bg-card/60 backdrop-blur-lg border-b border-border sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Mobile Toggle & Context */}
            <div className="flex items-center">
                <button
                    className="md:hidden mr-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                    onClick={toggleMobileSidebar}
                >
                    <Menu size={20} />
                </button>
                {/* Breadcrumb Placeholder or Page Title */}
                <nav className="hidden sm:flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-muted-foreground">App</span>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="mx-2 text-muted-foreground">/</span>
                                <span className="text-sm font-medium text-foreground">Dashboard</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
        </header>
    );
};

export default Header;
