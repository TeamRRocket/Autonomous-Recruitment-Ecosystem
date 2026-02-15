/**
 * INTEGRATION EXAMPLE: Recruiter Scores Page with Proctoring
 * 
 * This example shows how to integrate proctoring summary into recruiter's candidate scores view
 * 
 * USAGE:
 * 1. Fetch application data (includes proctoring_risk_score, proctoring_risk_level, proctoring_reason)
 * 2. Import ProctoringSummary component
 * 3. Add ProctoringSummary to candidate detail view
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProctoringSummary from '../../components/proctoring/ProctoringSummary';
import axios from 'axios';

const RecruiterCandidateScores = () => {
    const { applicationId } = useParams();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const response = await axios.get(
                    `/api/applications/${applicationId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                setApplication(response.data.data);
            } catch (error) {
                console.error('Failed to fetch application:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [applicationId]);

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!application) {
        return <div className="p-8 text-center">Application not found</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Candidate Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {application.candidate_name}
                </h1>
                <p className="text-slate-600">Application ID: {application.id}</p>
                <p className="text-slate-600">Job: {application.job_title}</p>
            </div>

            {/* Exam Scores Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Exam Scores</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Aptitude Score */}
                    {application.aptitude_score !== null && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">Aptitude Score</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {application.aptitude_score}
                                <span className="text-sm font-normal text-slate-600">/100</span>
                            </p>
                        </div>
                    )}

                    {/* DSA Score */}
                    {application.dsa_score !== null && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1">DSA Score</p>
                            <p className="text-3xl font-bold text-slate-900">
                                {application.dsa_score}
                                <span className="text-sm font-normal text-slate-600">/100</span>
                            </p>
                        </div>
                    )}

                    {/* Final Score */}
                    {application.final_score !== null && (
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <p className="text-sm text-indigo-600 mb-1">Final Score</p>
                            <p className="text-3xl font-bold text-indigo-900">
                                {application.final_score}
                                <span className="text-sm font-normal text-indigo-600">/100</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW: Proctoring Assessment Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Proctoring Assessment
                </h2>

                <ProctoringSummary
                    riskScore={application.proctoring_risk_score}
                    riskLevel={application.proctoring_risk_level}
                    reason={application.proctoring_reason}
                    detailed={true}
                />
            </div>

            {/* Other sections (resume, skills, etc.) */}
        </div>
    );
};

export default RecruiterCandidateScores;
