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
        <div className="h-[calc(100vh-64px)] overflow-hidden p-4 sm:p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
                    <div className="space-y-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold font-heading text-foreground mb-1 tracking-tight">{job.title}</h1>
                            {job.organization_name && (
                                <p className="text-lg text-muted-foreground font-medium">{job.organization_name}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                            {job.location && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{job.location}</span>
                                </div>
                            )}
                            {job.type && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>{job.type}</span>
                                </div>
                            )}
                            {job.salary_range && (
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{job.salary_range}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {/* About the Role */}
                        <div>
                            <h2 className="text-lg font-bold font-heading text-foreground mb-2">About the Role</h2>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>

                        {/* Requirements */}
                        {job.requirements && job.requirements.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold font-heading text-foreground mb-2">Requirements</h2>
                                <ul className="space-y-2">
                                    {job.degree && (
                                        <li className="flex items-center text-sm text-muted-foreground">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-2.5"></span>
                                            <span>{job.degree} degree or equivalent</span>
                                        </li>
                                    )}
                                    {job.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start text-sm text-muted-foreground">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mr-2.5 mt-1.5"></span>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Preferred Qualifications */}
                        {job.preferred_qualifications && job.preferred_qualifications.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold font-heading text-foreground mb-2">Preferred Qualifications</h2>
                                <ul className="space-y-2">
                                    {job.preferred_qualifications.map((qual, index) => (
                                        <li key={index} className="flex items-start text-sm text-muted-foreground">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mr-2.5 mt-1.5"></span>
                                            <span>{qual}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Skills Required */}
                        {job.requirements && job.requirements.length > 0 && (
                            <div className="pb-4">
                                <h2 className="text-lg font-bold font-heading text-foreground mb-2">Skills Required</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.requirements.slice(0, 8).map((req, idx) => {
                                        // Extract skill names (simple approach) or use the requirement text itself if short
                                        const words = req.split(' ');
                                        const skill = words.length <= 3 ? req : words.slice(0, 2).join(' ');
                                        return (
                                            <span key={idx} className="px-3 py-1 bg-secondary/10 text-foreground rounded-full border border-border/20 text-xs font-medium">
                                                {skill}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Status & Actions */}
                <div className="lg:col-span-4 h-full overflow-y-auto">
                    <div className="bg-card w-full rounded-xl border border-border/30 p-5 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Job Status</span>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${job.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                {job.status}
                            </span>
                        </div>

                        {isRecruiter && (
                            <>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-secondary/5 rounded-lg p-3 border border-border/10">
                                        <div className="text-2xl font-bold text-foreground">{applications.length || 0}</div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Applicants</div>
                                    </div>
                                    <div className="bg-secondary/5 rounded-lg p-3 border border-border/10">
                                        <div className="text-2xl font-bold text-foreground">Entry</div>
                                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">Level</div>
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <Link to={`/recruiter/applications?job=${id}`} className="flex items-center justify-center w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-primary/20">
                                        View Applicants
                                    </Link>
                                </div>
                            </>
                        )}

                        {isCandidate && job.status === 'PUBLISHED' && (
                            <div className="pt-2">
                                {hasApplied ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                                        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-emerald-500 font-bold text-sm">Applied Successfully</p>
                                        {myApplication?.status && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Status: <span className="font-semibold text-foreground uppercase">{myApplication.status}</span>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-3">Apply Now</h3>
                                        <div className="space-y-3">
                                            <div className="relative group">
                                                <input
                                                    id="resume-upload"
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="resume-upload"
                                                    className={`flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-lg cursor-pointer transition-all ${
                                                        resumeFile 
                                                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                                                        : 'border-border bg-secondary/5 hover:bg-secondary/10 hover:border-primary/30'
                                                    }`}
                                                >
                                                    {resumeFile ? (
                                                        <>
                                                           <svg className="w-6 h-6 text-emerald-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-xs font-medium text-emerald-600 truncate max-w-[90%]">{resumeFile.name}</span>
                                                            <span className="text-[10px] text-emerald-500/70 mt-0.5">Click to change</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-6 h-6 text-muted-foreground mb-1 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            <span className="text-xs text-muted-foreground group-hover:text-foreground">Upload Resume (PDF)</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                            
                                            <button
                                                onClick={handleApply}
                                                disabled={isApplying || !resumeFile}
                                                className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-lg ${
                                                    isApplying || !resumeFile
                                                    ? 'bg-muted cursor-not-allowed text-muted-foreground shadow-none'
                                                    : 'gradient-primary hover:opacity-90 shadow-primary/20'
                                                }`}
                                            >
                                                {isApplying ? 'Submitting...' : 'Submit Application'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
