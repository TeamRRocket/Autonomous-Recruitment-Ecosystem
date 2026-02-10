import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJob, getJobById, updateJob } from '../../services/jobService';
import toast from 'react-hot-toast';
import { X, Plus } from 'lucide-react';
import InputGroup from '../../components/ui/InputGroup';

const CreateEditJob = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        type: 'Full-time',
        expires_at: '',
        requirements: [],
        aptitude_enabled: false,
        aptitude_level: 'medium',
        aptitude_duration_minutes: 20,
        aptitude_question_count: 20
    });
    const [currentReq, setCurrentReq] = useState('');
    const [loading, setLoading] = useState(isEditMode);

    useEffect(() => {
        if (isEditMode) {
            fetchJob();
        }
    }, [id]);

    const fetchJob = async () => {
        try {
            const res = await getJobById(id);
            const job = res.data;
            let formattedDate = '';
            if (job.expires_at) {
                // Convert to YYYY-MM-DD for input
                const date = new Date(job.expires_at);
                formattedDate = date.toISOString().split('T')[0];
            }

            setFormData({
                title: job.title,
                description: job.description,
                location: job.location,
                type: job.type,
                expires_at: formattedDate,
                requirements: job.requirements || [],
                aptitude_enabled: !!job.aptitude_enabled,
                aptitude_level: job.aptitude_level || 'medium',
                aptitude_duration_minutes: job.aptitude_duration_minutes ?? 20,
                aptitude_question_count: job.aptitude_question_count ?? 20
            });
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load job details');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleReqKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addRequirement();
        }
    };

    const addRequirement = () => {
        if (!currentReq.trim()) return;
        if (formData.requirements.includes(currentReq.trim())) {
            toast.error('Requirement already exists');
            return;
        }
        setFormData({
            ...formData,
            requirements: [...formData.requirements, currentReq.trim()]
        });
        setCurrentReq('');
    };

    const removeRequirement = (reqToRemove) => {
        setFormData({
            ...formData,
            requirements: formData.requirements.filter(req => req !== reqToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!formData.title || !formData.description) {
                toast.error('Title and description are required');
                setLoading(false);
                return;
            }

            if (formData.requirements.length === 0) {
                toast.error('Please add at least one requirement');
                setLoading(false);
                return;
            }

            const payload = {
                title: formData.title,
                description: formData.description,
                location: formData.location || null,
                type: formData.type || null,
                requirements: formData.requirements,
                expires_at: formData.expires_at || null,
                aptitude_enabled: !!formData.aptitude_enabled,
                aptitude_level: formData.aptitude_enabled ? (formData.aptitude_level || 'medium') : null,
                aptitude_duration_minutes: formData.aptitude_enabled ? parseInt(formData.aptitude_duration_minutes) : null,
                aptitude_question_count: formData.aptitude_enabled ? parseInt(formData.aptitude_question_count) : null
            };

            if (isEditMode) {
                await updateJob(id, payload);
                toast.success('Job updated successfully');
            } else {
                await createJob(payload);
                toast.success('Job created successfully');
            }
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save job';
            toast.error(errorMessage);
            console.error('Job save error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-3xl w-full">
                <div className="mb-8">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1 transition-colors">
                        &larr; Back to Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-white">
                        {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
                    </h2>
                    <p className="mt-2 text-slate-400">
                        Reach thousands of qualified candidates.
                    </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl shadow-xl overflow-hidden p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 gap-6">
                            <InputGroup
                                label="Job Title"
                                name="title"
                                placeholder="e.g. Senior Frontend Engineer"
                                required
                                value={formData.title}
                                onChange={handleChange}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup
                                    label="Location"
                                    name="location"
                                    placeholder="e.g. Remote, San Francisco"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <InputGroup
                                    label="Employment Type"
                                    name="type"
                                    options={['Full-time', 'Contract', 'Part-time', 'Internship']}
                                    value={formData.type}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Job Expiry Date */}
                            <InputGroup
                                label="Application Deadline"
                                name="expires_at"
                                type="date"
                                placeholder="Select end date"
                                value={formData.expires_at}
                                onChange={handleChange}
                            />

                            {/* Requirements Tag Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Requirements <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        className="input-field flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm rounded-lg p-2.5"
                                        placeholder="Add a requirement (e.g. React, 3+ years experience)"
                                        value={currentReq}
                                        onChange={(e) => setCurrentReq(e.target.value)}
                                        onKeyDown={handleReqKeyDown}
                                    />
                                    <button
                                        type="button"
                                        onClick={addRequirement}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.requirements.map((req, idx) => (
                                        <div key={idx} className="flex items-center bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg text-sm">
                                            <span>{req}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeRequirement(req)}
                                                className="ml-2 text-blue-400 hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.requirements.length === 0 && (
                                        <span className="text-sm text-slate-500 italic">No requirements added yet.</span>
                                    )}
                                </div>
                            </div>

                            <InputGroup
                                label="Description"
                                name="description"
                                isTextArea
                                placeholder="Describe the role, responsibilities, and company culture..."
                                required
                                value={formData.description}
                                onChange={handleChange}
                            />

                            <div className="border-t border-slate-700/60 pt-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-white font-semibold">Aptitude Round (MCQ)</p>
                                        <p className="text-xs text-slate-500">Enable and configure aptitude assessment for candidates.</p>
                                    </div>
                                    <label className="flex items-center gap-2 text-slate-300">
                                        <input
                                            type="checkbox"
                                            name="aptitude_enabled"
                                            checked={!!formData.aptitude_enabled}
                                            onChange={handleChange}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                                        />
                                        Enabled
                                    </label>
                                </div>

                                <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 ${formData.aptitude_enabled ? '' : 'opacity-50'}`}>
                                    <InputGroup
                                        label="Difficulty"
                                        name="aptitude_level"
                                        options={['easy', 'medium', 'hard']}
                                        value={formData.aptitude_level}
                                        onChange={handleChange}
                                    />
                                    <InputGroup
                                        label="Duration (mins)"
                                        name="aptitude_duration_minutes"
                                        type="number"
                                        value={formData.aptitude_duration_minutes}
                                        onChange={handleChange}
                                        placeholder="e.g. 20"
                                    />
                                    <InputGroup
                                        label="Question Count"
                                        name="aptitude_question_count"
                                        type="number"
                                        value={formData.aptitude_question_count}
                                        onChange={handleChange}
                                        placeholder="e.g. 20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700 focus:outline-none transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg"
                            >
                                {isEditMode ? 'Update Job' : 'Create Job'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEditJob;
