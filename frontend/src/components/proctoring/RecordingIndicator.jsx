import React from 'react';

/**
 * Recording Indicator
 * Displays a visible indicator that proctoring is active
 */
const RecordingIndicator = () => {
    return (
        <div className="fixed top-4 right-4 z-50 flex items-center bg-red-600 text-white px-4 py-2 rounded-full shadow-lg">
            <div className="relative mr-2">
                <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-200"></span>
                </span>
            </div>
            <span className="text-sm font-medium">Recording</span>
        </div>
    );
};

export default RecordingIndicator;
