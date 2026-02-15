import React from 'react';

/**
 * Proctoring Consent Modal
 * Displays before exam starts to get user consent for webcam monitoring
 */
const ProctoringConsent = ({ onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
                <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Proctoring Consent Required</h2>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                        This exam uses AI-based proctoring to ensure exam integrity. Before you proceed, please review and accept the following:
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">What will be monitored:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>Your webcam feed for face detection</li>
                            <li>Head movements and eye tracking</li>
                            <li>Tab switches and window focus changes</li>
                            <li>Copy/paste activities</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Privacy & Data:</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            <li>Only behavioral event data is stored (no raw video)</li>
                            <li>Data is used solely for exam integrity assessment</li>
                            <li>Data is retained for 30 days and then deleted</li>
                            <li>Access is restricted to authorized recruiters only</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Important:</strong> You must grant webcam permission to proceed with the exam.
                                    A recording indicator will be visible throughout the exam.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onDecline}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Decline & Exit
                    </button>
                    <button
                        onClick={onAccept}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        I Accept & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProctoringConsent;
