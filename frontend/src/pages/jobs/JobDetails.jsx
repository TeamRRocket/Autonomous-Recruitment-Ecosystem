import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJobById } from '../../services/jobService';
import { applyToJob, checkApplication, getApplicationsByJob, updateApplicationStatus } from '../../services/applicationService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const JobDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applications, setApplications] = useState([]);
    const [hasApplied, setHasApplied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getJobById(id);
                setJob(res.data);

                if (user?.role === 'CANDIDATE') {
                    // Check if candidate has already applied
                    try {
                        const checkRes = await checkApplication(id);
                        setHasApplied(checkRes.data.applied);
                    } catch (err) {
                        console.error('Failed to check application status', err);
                    }
                } else if (user?.role === 'RECRUITER') {
                    // Fetch applicants for this job
                    try {
                        const appsRes = await getApplicationsByJob(id);
                        setApplications(appsRes.data || []);
                    } catch (err) {
                        console.error('Failed to fetch applications', err);
                    }
                }
            } catch (err) {
                setError('Job not found or access denied');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleApply = async () => {
        if (!resumeFile && !hasApplied) {
            toast.error('Please select a PDF resume file');
            return;
        }

        setIsApplying(true);
        try {
            await applyToJob(id, resumeFile);
            toast.success('Application submitted successfully!');
            setHasApplied(true);
            setResumeFile(null);
            // Reset file input
            const fileInput = document.getElementById('resume-upload');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit application');
        } finally {
            setIsApplying(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file only');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setResumeFile(file);
        }
    };

    const handleStatusUpdate = async (applicationId, newStatus) => {
        try {
            await updateApplicationStatus(applicationId, newStatus);
            toast.success(`Application status updated to ${newStatus}`);
            // Refresh applications list
            const appsRes = await getApplicationsByJob(id);
            setApplications(appsRes.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update application status');
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Loading...</div>;
    if (error) return <div className="text-red-400 text-center mt-10 p-4 border border-red-500/50 bg-red-900/10 rounded-lg mx-auto max-w-md">{error}</div>;

    const isRecruiter = user?.role === 'RECRUITER';
    const isCandidate = user?.role === 'CANDIDATE';

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors">
                    &larr; Back to Dashboard
                </Link>

                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-8 border-b border-slate-700/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${job.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                job.status === 'CLOSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {job.status}
                            </span>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
                            {job.organization_name && (
                                <div className="flex items-center bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 text-blue-400 font-bold">
                                    <span className="mr-2">🏢</span> {job.organization_name}
                                </div>
                            )}
                            {job.location && (
                                <div className="flex items-center bg-slate-700/30 px-3 py-1.5 rounded-lg border border-slate-700">
                                    <span className="mr-2">📍</span> {job.location}
                                </div>
                            )}
                            {job.type && (
                                <div className="flex items-center bg-slate-700/30 px-3 py-1.5 rounded-lg border border-slate-700 font-medium">
                                    <span className="mr-2">💼</span> {job.type}
                                </div>
                            )}
                            {job.experience_level && (
                                <div className="flex items-center bg-slate-700/30 px-3 py-1.5 rounded-lg border border-slate-700 capitalize font-medium">
                                    <span className="mr-2">📊</span> {job.experience_level.toLowerCase()} Level
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 space-y-10">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <span className="bg-blue-500/10 p-2 rounded-lg text-blue-400 mr-3">📄</span>
                                Description
                            </h3>
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-11 text-lg">
                                {job.description}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <span className="bg-purple-500/10 p-2 rounded-lg text-purple-400 mr-3">✅</span>
                                    Minimum Qualifications
                                </h3>
                                <div className="pl-11 space-y-4">
                                    {job.degree && (
                                        <div className="flex items-start text-slate-300 bg-slate-700/20 p-3 rounded-lg border border-slate-700/30">
                                            <span className="text-blue-400 mr-2">🎓</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Education</p>
                                                <p>{job.degree} or equivalent practical experience.</p>
                                            </div>
                                        </div>
                                    )}
                                    <ul className="grid gap-3">
                                        {job.requirements && job.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start text-slate-300 bg-slate-700/10 p-3 rounded-lg border border-slate-800/50">
                                                <span className="text-purple-400 mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {job.preferred_qualifications && job.preferred_qualifications.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                        <span className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 mr-3">🌟</span>
                                        Preferred Qualifications
                                    </h3>
                                    <ul className="grid gap-3 pl-11">
                                        {job.preferred_qualifications.map((qual, index) => (
                                            <li key={index} className="flex items-start text-slate-300 bg-slate-700/10 p-3 rounded-lg border border-slate-800/50">
                                                <span className="text-emerald-400 mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                {qual}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {isCandidate && job.status === 'PUBLISHED' && (
                        <div className="px-8 py-6 bg-slate-900/50 border-t border-slate-700 space-y-4">
                            {hasApplied ? (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                    <p className="text-green-400 font-medium">✓ You have already applied to this job</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Upload Resume (PDF only)
                                        </label>
                                        <input
                                            id="resume-upload"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-slate-300
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-600 file:text-white
                                                hover:file:bg-indigo-700
                                                file:cursor-pointer
                                                bg-slate-700/30 border border-slate-600 rounded-lg"
                                        />
                                        {resumeFile && (
                                            <p className="mt-2 text-sm text-green-400">Selected: {resumeFile.name}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleApply}
                                        disabled={isApplying || !resumeFile}
                                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:transform-none"
                                    >
                                        {isApplying ? 'Submitting...' : 'Apply for this Job'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isRecruiter && (
                        <div className="px-8 py-6 bg-slate-900/50 border-t border-slate-700">
                            <h3 className="text-lg font-semibold text-white mb-4">Applicants ({applications.length})</h3>
                            {applications.length === 0 ? (
                                <p className="text-slate-400">No applicants yet for this job.</p>
                            ) : (
                                <div className="space-y-3">
                                    {applications.map((app) => (
                                        <div key={app.id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-white font-medium">{app.candidate_name}</h4>
                                                    {app.years_of_experience && (
                                                        <p className="text-sm text-slate-400 mt-1">
                                                            {app.years_of_experience} years of experience
                                                        </p>
                                                    )}
                                                    {app.primary_skills && app.primary_skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {app.primary_skills.slice(0, 5).map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-xs border border-indigo-500/20">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={app.status}
                                                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                                        className="px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="REVIEWING">REVIEWING</option>
                                                        <option value="SHORTLISTED">SHORTLISTED</option>
                                                        <option value="REJECTED">REJECTED</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {app.resume_file_path && (
                                                <div className="mt-3">
                                                    <a
                                                        href={`http://localhost:3000/uploads/resumes/${app.resume_file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        View Resume
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
