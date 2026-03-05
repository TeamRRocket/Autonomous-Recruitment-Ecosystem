import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJobById } from '../../services/jobService';
import { applyToJob, checkApplication, getApplicationsByJob, getMyApplications, updateApplicationStatus } from '../../services/applicationService';
import { getJobScores } from '../../services/jobScoresService';
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
    const [scores, setScores] = useState(null);
    const [scoresLoading, setScoresLoading] = useState(false);
    const [myApplication, setMyApplication] = useState(null);

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

    useEffect(() => {
        const fetchMyApplication = async () => {
            if (!user || user.role !== 'CANDIDATE') return;
            if (!id) return;
            if (!hasApplied) {
                setMyApplication(null);
                return;
            }

            try {
                const res = await getMyApplications();
                const list = res.data || [];
                const app = list.find((a) => String(a.job_id) === String(id));
                setMyApplication(app || null);
            } catch (err) {
                setMyApplication(null);
            }
        };

        fetchMyApplication();
    }, [id, user, hasApplied]);

    useEffect(() => {
        const fetchScores = async () => {
            if (!user || user.role !== 'RECRUITER') return;
            if (!id) return;

            setScoresLoading(true);
            try {
                const res = await getJobScores(id);
                setScores(res.data);
            } catch (err) {
                setScores(null);
            } finally {
                setScoresLoading(false);
            }
        };

        fetchScores();
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
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="glass-card overflow-hidden">
                    <div className="p-8">
                        {/* Header Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content - Left Side */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Title and Company */}
                                <div>
                                    <h1 className="text-4xl font-bold font-heading text-foreground mb-2">{job.title}</h1>
                                    {job.organization_name && (
                                        <p className="text-xl text-muted-foreground">{job.organization_name}</p>
                                    )}
                                </div>

                                {/* Job Meta Info */}
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                    {job.location && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{job.location}</span>
                                        </div>
                                    )}
                                    {job.type && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{job.type}</span>
                                        </div>
                                    )}
                                    {job.salary_range && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{job.salary_range}</span>
                                        </div>
                                    )}
                                </div>

                                {/* About the Role */}
                                <div>
                                    <h2 className="text-2xl font-bold font-heading text-foreground mb-4">About the Role</h2>
                                    <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {job.description}
                                    </div>
                                </div>

                                {/* Requirements */}
                                {job.requirements && job.requirements.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-heading text-foreground mb-4">Requirements</h2>
                                        <ul className="space-y-3">
                                            {job.degree && (
                                                <li className="flex items-start text-foreground">
                                                    <span className="text-primary mr-3 mt-1">•</span>
                                                    <span>{job.degree} degree or equivalent</span>
                                                </li>
                                            )}
                                            {job.requirements.map((req, index) => (
                                                <li key={index} className="flex items-start text-foreground">
                                                    <span className="text-primary mr-3 mt-1">•</span>
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Skills Required */}
                                {job.requirements && job.requirements.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-heading text-foreground mb-4">Skills Required</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {job.requirements.slice(0, 6).map((req, idx) => {
                                                // Extract skill names from requirement text (simple approach)
                                                const skillMatch = req.match(/\b[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+)*\b/g);
                                                const skills = skillMatch ? skillMatch.slice(0, 2) : [req.split(' ').slice(0, 2).join(' ')];
                                                return skills.map((skill, i) => (
                                                    <span key={`${idx}-${i}`} className="px-4 py-2 bg-primary/10 text-primary rounded-lg border border-primary/20 text-sm font-medium">
                                                        {skill}
                                                    </span>
                                                ));
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Preferred Qualifications */}
                                {job.preferred_qualifications && job.preferred_qualifications.length > 0 && (
                                    <div>
                                        <h2 className="text-2xl font-bold font-heading text-foreground mb-4">Preferred Qualifications</h2>
                                        <ul className="space-y-3">
                                            {job.preferred_qualifications.map((qual, index) => (
                                                <li key={index} className="flex items-start text-foreground">
                                                    <span className="text-success mr-3 mt-1">•</span>
                                                    <span>{qual}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar - Apply Section */}
                            <div className="lg:col-span-1">

                                {isCandidate && job.status === 'PUBLISHED' && (
                                    <div className="glass-card p-6 sticky top-8">
                                        <h3 className="text-xl font-bold font-heading text-foreground mb-6">Apply Now</h3>
                                        {hasApplied ? (
                                            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                                                <p className="text-success font-medium">✓ You have already applied to this job</p>
                                                {myApplication?.status && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Status: <span className="font-semibold text-foreground">{myApplication.status}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                        Upload your resume (PDF)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="resume-upload"
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                        />
                                                        <label
                                                            htmlFor="resume-upload"
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-accent hover:bg-accent/80 transition-colors"
                                                        >
                                                            <svg className="w-8 h-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            <span className="text-sm text-muted-foreground">
                                                                {resumeFile ? resumeFile.name : 'Choose file'}
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleApply}
                                                    disabled={isApplying || !resumeFile}
                                                    className="w-full gradient-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isApplying ? 'Submitting...' : 'Submit Application'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status Badge for Recruiter */}
                                {isRecruiter && (
                                    <div className="glass-card p-6 sticky top-8">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Job Status</h3>
                                            <span className={`${
                                                job.status === 'PUBLISHED' ? 'status-published' :
                                                job.status === 'CLOSED' ? 'status-closed' :
                                                'status-draft'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Applicants:</span>
                                                <span className="font-semibold text-foreground">{applications.length}</span>
                                            </div>
                                            {job.experience_level && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Level:</span>
                                                    <span className="font-semibold text-foreground capitalize">{job.experience_level.toLowerCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isRecruiter && (
                        <div className="px-8 py-6 border-t border-border">
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-foreground font-heading mb-4">Candidate Scores</h3>

                                {scoresLoading && (
                                    <p className="text-muted-foreground">Loading scores...</p>
                                )}

                                {!scoresLoading && (!scores?.candidates || scores.candidates.length === 0) && (
                                    <p className="text-muted-foreground">No candidates yet to display scores.</p>
                                )}

                                {!scoresLoading && (scores?.candidates || []).length > 0 && (
                                    <div className="space-y-3">
                                        {(scores?.candidates || []).map((row) => (
                                            <div key={row.candidate.id} className="glass-card p-4">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                    <div>
                                                        <p className="text-foreground font-semibold">{row.candidate.name}</p>
                                                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{row.application.status}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div className="bg-accent border border-border rounded-md px-3 py-2">
                                                            <p className="text-xs text-muted-foreground">Resume</p>
                                                            <p className="text-foreground font-semibold">{row.scores.resume.score ?? '--'}</p>
                                                        </div>
                                                        <div className="bg-accent border border-border rounded-md px-3 py-2">
                                                            <p className="text-xs text-muted-foreground">Aptitude</p>
                                                            <p className="text-foreground font-semibold">{row.scores.aptitude.score ?? '--'}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.scores.aptitude.status}</p>
                                                        </div>
                                                        <div className="bg-accent border border-border rounded-md px-3 py-2">
                                                            <p className="text-xs text-muted-foreground">DSA</p>
                                                            <p className="text-foreground font-semibold">{row.scores.dsa.score ?? '--'}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.scores.dsa.status}</p>
                                                        </div>
                                                        <div className="bg-accent border border-border rounded-md px-3 py-2">
                                                            <p className="text-xs text-muted-foreground">Coding</p>
                                                            <p className="text-foreground font-semibold">{row.scores.coding.avg_score_percent ?? '--'}{row.scores.coding.avg_score_percent != null ? '%' : ''}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{(row.scores.coding.rounds || []).length} rounds</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-foreground font-heading mb-4">Applicants ({applications.length})</h3>
                            {applications.length === 0 ? (
                                <p className="text-muted-foreground">No applicants yet for this job.</p>
                            ) : (
                                <div className="space-y-3">
                                    {applications.map((app) => (
                                        <div key={app.id} className="glass-card p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-foreground font-semibold font-heading">{app.candidate_name}</h4>
                                                    {app.years_of_experience && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {app.years_of_experience} years of experience
                                                        </p>
                                                    )}
                                                    {app.primary_skills && app.primary_skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {app.primary_skills.slice(0, 5).map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs border border-primary/20">
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
                                                        className="px-3 py-1 rounded-lg bg-input border border-border text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
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
                                                        className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-2"
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
