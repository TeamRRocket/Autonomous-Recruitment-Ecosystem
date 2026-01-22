import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const DashboardLayout = () => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

    return (
        <div className="min-h-screen bg-slate-950 flex font-sans text-slate-300">
            {/* Sidebar (Desktop) */}
            <Sidebar />

            {/* Mobile Sidebar Overlay (Simplified) */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setMobileSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800">
                        {/* Re-use Sidebar content mechanism or component here? 
                            For MVP, let's just use the Sidebar component but styled for drawer if it supports it, 
                            or we can trust the Sidebar is responsive. 
                            Our current Sidebar has 'hidden md:flex'. 
                            Let's adjust Sidebar props or CSS to handle this later.
                            For now, let's keep it simple: The persistent sidebar is strictly Desktop.
                        */}
                        <div className="p-4 text-white">
                            Menu (Mobile functionality to be enhanced)
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:pl-64 min-w-0 bg-slate-950">
                <Header toggleMobileSidebar={toggleMobileSidebar} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
