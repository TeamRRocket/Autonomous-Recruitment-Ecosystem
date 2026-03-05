import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const DashboardLayout = () => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

    return (
        <div className="min-h-screen bg-background flex font-body text-foreground">
            {/* Sidebar (Desktop) */}
            <Sidebar />

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                    <div 
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
                        onClick={() => setMobileSidebarOpen(false)}
                    ></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar border-r border-sidebar-border">
                        <div className="p-4 text-sidebar-foreground">
                            Menu (Mobile functionality to be enhanced)
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-[250px] min-w-0">
                <Header toggleMobileSidebar={toggleMobileSidebar} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
