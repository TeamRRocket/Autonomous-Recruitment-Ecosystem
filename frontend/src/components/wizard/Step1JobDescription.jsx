import React, { useState, useEffect } from 'react';
import InputGroup from '../ui/InputGroup';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Step1JobDescription = ({ formData, setFormData, onNext }) => {
    const [localData, setLocalData] = useState({
        title: formData.title || '',
        department: formData.department || '',
        location: formData.location || '',
        type: formData.type || 'Full-time',
        experience_level: formData.experience_level || 'ENTRY',
        description: formData.description || '',
        responsibilities: formData.responsibilities || [],
        expires_at: formData.expires_at || '',
        degree: formData.degree || "Bachelor's",
        preferred_qualifications: formData.preferred_qualifications || []
    });

    const [currentResp, setCurrentResp] = useState('');
    const [currentPref, setCurrentPref] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalData(prev => ({ ...prev, [name]: value }));
    };

    const addResponsibility = () => {
        if (!currentResp.trim()) return;
        if (localData.responsibilities.includes(currentResp.trim())) {
            toast.error('Requirement already exists');
            return;
        }
        setLocalData(prev => ({
            ...prev,
            responsibilities: [...prev.responsibilities, currentResp.trim()]
        }));
        setCurrentResp('');
    };

    const removeResponsibility = (respToRemove) => {
        setLocalData(prev => ({
            ...prev,
            responsibilities: prev.responsibilities.filter(r => r !== respToRemove)
        }));
    };

    const addPreferredQual = () => {
        if (!currentPref.trim()) return;
        if (localData.preferred_qualifications.includes(currentPref.trim())) {
            toast.error('Qualification already exists');
            return;
        }
        setLocalData(prev => ({
            ...prev,
            preferred_qualifications: [...prev.preferred_qualifications, currentPref.trim()]
        }));
        setCurrentPref('');
    };

    const removePreferredQual = (qualToRemove) => {
        setLocalData(prev => ({
            ...prev,
            preferred_qualifications: prev.preferred_qualifications.filter(q => q !== qualToRemove)
        }));
    };

    const isFormValid = () => {
        const { title, department, location, description, responsibilities, expires_at } = localData;
        const isFutureDate = expires_at ? new Date(expires_at) > new Date() : false;

        return (
            title.trim() !== '' &&
            department.trim() !== '' &&
            location.trim() !== '' &&
            description.trim().length >= 50 &&
            responsibilities.length > 0 &&
            isFutureDate
        );
    };

    const handleContinue = () => {
        if (!isFormValid()) {
            toast.error('Please fill all required fields correctly');
            return;
        }
        setFormData(prev => ({ ...prev, ...localData }));
        onNext(localData);
    };

    const handleRespKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addResponsibility();
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup
                    label="Job Title"
                    name="title"
                    placeholder="e.g. Senior Frontend Engineer"
                    required
                    value={localData.title}
                    onChange={handleChange}
                />
                <InputGroup
                    label="Department"
                    name="department"
                    placeholder="e.g. Engineering, Sales"
                    required
                    value={localData.department}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup
                    label="Location"
                    name="location"
                    placeholder="e.g. Remote, Mumbai"
                    required
                    value={localData.location}
                    onChange={handleChange}
                />
                <InputGroup
                    label="Job Type"
                    name="type"
                    options={['Full-time', 'Part-time', 'Internship']}
                    required
                    value={localData.type}
                    onChange={handleChange}
                />
                <InputGroup
                    label="Experience Level"
                    name="experience_level"
                    options={['ENTRY', 'MID', 'SENIOR', 'ADVANCED']}
                    required
                    value={localData.experience_level}
                    onChange={handleChange}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup
                    label="Minimum Degree Requirement"
                    name="degree"
                    options={["Bachelor's", "Master's", "PhD", "Associate", "No Degree Required"]}
                    required
                    value={localData.degree}
                    onChange={handleChange}
                />
            </div>

            <InputGroup
                label="Job Description"
                name="description"
                isTextArea
                placeholder="Describe the role and your company (min 50 chars)..."
                required
                value={localData.description}
                onChange={handleChange}
                rows={4}
            />

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Minimum Qualifications / Responsibilities <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        className="input-field flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500 block sm:text-sm rounded-lg p-2.5"
                        placeholder="Add a minimum qualification..."
                        value={currentResp}
                        onChange={(e) => setCurrentResp(e.target.value)}
                        onKeyDown={handleRespKeyDown}
                    />
                    <button
                        type="button"
                        onClick={addResponsibility}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {localData.responsibilities.map((resp, idx) => (
                        <div key={idx} className="flex items-center bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-lg text-sm">
                            <span>{resp}</span>
                            <button
                                type="button"
                                onClick={() => removeResponsibility(resp)}
                                className="ml-2 text-blue-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Preferred Qualifications
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        className="input-field flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500 block sm:text-sm rounded-lg p-2.5"
                        placeholder="Add a preferred qualification (optional)..."
                        value={currentPref}
                        onChange={(e) => setCurrentPref(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferredQual())}
                    />
                    <button
                        type="button"
                        onClick={addPreferredQual}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {localData.preferred_qualifications.map((qual, idx) => (
                        <div key={idx} className="flex items-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg text-sm">
                            <span>{qual}</span>
                            <button
                                type="button"
                                onClick={() => removePreferredQual(qual)}
                                className="ml-2 text-indigo-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <InputGroup
                label="Job Ending Date"
                name="expires_at"
                type="date"
                required
                value={localData.expires_at}
                onChange={handleChange}
            />

            <div className="pt-6 flex justify-end">
                <button
                    onClick={handleContinue}
                    disabled={!isFormValid()}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${isFormValid()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                >
                    Continue to Rounds Selection
                </button>
            </div>
        </div>
    );
};

export default Step1JobDescription;
