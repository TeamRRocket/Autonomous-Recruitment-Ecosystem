import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Step1JobDescription = ({ formData, setFormData, onNext }) => {
    const [localData, setLocalData] = useState({
        title: formData.title || '',
        location: formData.location || '',
        type: formData.type || 'Full-time',
        experience_level: formData.experience_level || 'ENTRY',
        degree: formData.degree || "Bachelor's",
        department: formData.department || '',
        responsibilities: formData.responsibilities || [], // Mapping to "Required Skills"
        description: formData.description || '',
        expires_at: formData.expires_at || '',
    });

    const [skillInput, setSkillInput] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSkill = (e) => {
        if ((e.key === 'Enter' || e.type === 'click') && skillInput.trim()) {
            e.preventDefault();
            if (!localData.responsibilities.includes(skillInput.trim())) {
                setLocalData(prev => ({
                    ...prev,
                    responsibilities: [...prev.responsibilities, skillInput.trim()]
                }));
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setLocalData(prev => ({
            ...prev,
            responsibilities: prev.responsibilities.filter(s => s !== skill)
        }));
    };

    const handleNext = () => {
        // Basic validation
        if (!localData.title || !localData.location || !localData.description || !localData.expires_at) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (localData.responsibilities.length === 0) {
            toast.error('Please add at least one required skill');
            return;
        }
        onNext(localData);
    };

    return (
        <div className="space-y-4 animate-fade-in text-sm text-foreground">
            {/* Row 1: Title (50%), Location (50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Title</label>
                    <input
                        type="text"
                        name="title"
                        value={localData.title}
                        onChange={handleChange}
                        className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                        placeholder="e.g. Senior Frontend Engineer"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</label>
                    <input
                        type="text"
                        name="location"
                        value={localData.location}
                        onChange={handleChange}
                        className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                        placeholder="e.g. Remote"
                    />
                </div>
            </div>

            {/* Row 2: Type (50%), Experience (50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Type</label>
                    <div className="relative">
                        <select
                            name="type"
                            value={localData.type}
                            onChange={handleChange}
                            className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none text-foreground"
                        >
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Experience Level</label>
                    <div className="relative">
                        <select
                            name="experience_level"
                            value={localData.experience_level}
                            onChange={handleChange}
                            className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none text-foreground"
                        >
                            <option value="ENTRY">Entry Level</option>
                            <option value="MID">3-5 years</option>
                            <option value="SENIOR">Senior Level</option>
                            <option value="LEAD">Lead / Architect</option>
                            <option value="EXECUTIVE">Executive</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Degree (50%), Skills (50%) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Degree</label>
                    <div className="relative">
                        <select
                            name="degree"
                            value={localData.degree}
                            onChange={handleChange}
                            className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all appearance-none text-foreground"
                        >
                            <option>None</option>
                            <option>High School</option>
                            <option>Associate's</option>
                            <option>Bachelor's</option>
                            <option>BS in Computer Science</option>
                            <option>Master's</option>
                            <option>PhD</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills</label>
                    <div className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary transition-all flex flex-wrap gap-1.5 min-h-[38px] items-center">
                        {localData.responsibilities.map((skill, idx) => (
                            <span key={idx} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 border border-primary/20">
                                {skill}
                                <button onClick={() => removeSkill(skill)} className="hover:text-primary/70">
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                            className="bg-transparent outline-none flex-1 min-w-[80px] text-foreground placeholder:text-muted-foreground/30 text-xs h-full py-1"
                            placeholder="Add skill..."
                        />
                    </div>
                </div>
            </div>

            {/* Row 4: Description */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea
                    name="description"
                    value={localData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 resize-none text-foreground"
                    placeholder="Describe the role..."
                />
            </div>
            
            {/* Additional Fields (Department, Deadline) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</label>
                    <input
                        type="text"
                        name="department"
                        value={localData.department}
                        onChange={handleChange}
                        className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground placeholder:text-muted-foreground/30"
                        placeholder="e.g. Engineering"
                    />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deadline</label>
                    <input
                        type="date"
                        name="expires_at"
                        value={localData.expires_at}
                        onChange={handleChange}
                        className="w-full bg-secondary/5 border border-border/20 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground placeholder:text-muted-foreground/30" 
                    />
                </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
                <button
                    onClick={handleNext}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-md transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20 text-sm"
                >
                    Save & Next Step
                </button>
            </div>
        </div>
    );
};

export default Step1JobDescription;
