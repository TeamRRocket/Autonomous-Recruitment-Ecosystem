import React, { useState, useEffect, useMemo } from 'react';
import { getPublishedJobs } from '../../services/jobService';
import {
    Search,
    MapPin,
    Briefcase,
    Clock,
    ChevronDown,
    ChevronUp,
    Filter,
    X,
    CheckCircle2,
    GraduationCap,
    Layers,
    Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

const FilterAccordion = ({ title, children, isOpen, onToggle }) => (
    <div className="border-b border-border">
        <button
            onClick={onToggle}
            className="w-full py-4 flex items-center justify-between text-foreground hover:text-primary transition-colors"
        >
            <span className="text-sm font-bold tracking-tight font-heading">{title}</span>
            {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </button>
        {isOpen && <div className="pb-6 animate-fade-in">{children}</div>}
    </div>
);

const CheckboxFilter = ({ label, count, checked, onChange }) => (
    <label className="flex items-center group cursor-pointer py-1.5">
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checked
            ? 'bg-primary border-primary shadow-sm'
            : 'bg-input border-border group-hover:border-primary/50'
            }`}>
            {checked && <CheckCircle2 size={10} className="text-white fill-white" />}
        </div>
        <span className={`ml-3 text-sm transition-colors ${checked ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
            {label}
        </span>
        {count !== undefined && <span className="ml-auto text-xs text-muted-foreground font-medium">{count}</span>}
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
    </label>
);

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openFilters, setOpenFilters] = useState({
        locations: true,
        experience: true,
        skills: true,
        degree: true,
        jobTypes: true,
        organizations: true
    });

    const [filters, setFilters] = useState({
        locations: [],
        experience: [],
        degrees: [],
        types: [],
        organizations: []
    });

    const [skillSearch, setSkillSearch] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await getPublishedJobs();
            setJobs(res.data);
        } catch (err) {
            toast.error('Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    const toggleFilterSection = (section) => {
        setOpenFilters(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleFilterChange = (category, value) => {
        setFilters(prev => {
            const current = prev[category];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    const clearFilters = () => {
        setFilters({
            locations: [],
            experience: [],
            degrees: [],
            types: [],
            organizations: []
        });
        setSearchTerm('');
    };

    const filterStats = useMemo(() => {
        return {
            locations: [...new Set(jobs.map(j => j.location))].filter(Boolean),
            experience: [...new Set(jobs.map(j => j.experience_level))].filter(Boolean),
            degrees: [...new Set(jobs.map(j => j.degree))].filter(Boolean),
            types: [...new Set(jobs.map(j => j.type))].filter(Boolean),
            organizations: [...new Set(jobs.map(j => j.organization_name))].filter(Boolean)
        };
    }, [jobs]);

    const filteredJobs = jobs.filter(job => {
        const matchesGlobalSearch = !searchTerm ||
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLocation = filters.locations.length === 0 || filters.locations.includes(job.location);
        const matchesExperience = filters.experience.length === 0 || filters.experience.includes(job.experience_level);
        const matchesDegree = filters.degrees.length === 0 || filters.degrees.includes(job.degree);
        const matchesType = filters.types.length === 0 || filters.types.includes(job.type);
        const matchesOrg = filters.organizations.length === 0 || filters.organizations.includes(job.organization_name);

        return matchesGlobalSearch && matchesLocation && matchesExperience && matchesDegree && matchesType && matchesOrg;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse text-sm uppercase tracking-widest">Searching Opportunities...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-10 min-h-screen px-4 md:px-8 py-8 animate-fade-in">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
                        <Filter size={18} className="text-primary" />
                        Filters
                    </h2>
                    <button
                        onClick={clearFilters}
                        className="text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                    >
                        Clear all
                    </button>
                </div>

                <div className="glass-card p-6">
                    <div className="space-y-2">
                        <FilterAccordion
                            title="Locations"
                            isOpen={openFilters.locations}
                            onToggle={() => toggleFilterSection('locations')}
                        >
                            {filterStats.locations.map(loc => (
                                <CheckboxFilter
                                    key={loc}
                                    label={loc}
                                    checked={filters.locations.includes(loc)}
                                    onChange={() => handleFilterChange('locations', loc)}
                                />
                            ))}
                        </FilterAccordion>

                        <FilterAccordion
                            title="Experience"
                            isOpen={openFilters.experience}
                            onToggle={() => toggleFilterSection('experience')}
                        >
                            {filterStats.experience.map(exp => (
                                <CheckboxFilter
                                    key={exp}
                                    label={exp}
                                    checked={filters.experience.includes(exp)}
                                    onChange={() => handleFilterChange('experience', exp)}
                                />
                            ))}
                        </FilterAccordion>

                        <FilterAccordion
                            title="Skills & qualifications"
                            isOpen={openFilters.skills}
                            onToggle={() => toggleFilterSection('skills')}
                        >
                            <div className="relative mb-4 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                                <input
                                    type="text"
                                    placeholder="e.g. Finance, Coding"
                                    className="w-full bg-input border border-border rounded-lg py-2 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-medium"
                                    value={skillSearch}
                                    onChange={(e) => setSkillSearch(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground italic px-1">Tip: Filter by specific skills you possess.</p>
                        </FilterAccordion>

                        <FilterAccordion
                            title="Degree"
                            isOpen={openFilters.degree}
                            onToggle={() => toggleFilterSection('degree')}
                        >
                            {filterStats.degrees.map(deg => (
                                <CheckboxFilter
                                    key={deg}
                                    label={deg}
                                    checked={filters.degrees.includes(deg)}
                                    onChange={() => handleFilterChange('degrees', deg)}
                                />
                            ))}
                        </FilterAccordion>

                        <FilterAccordion
                            title="Job types"
                            isOpen={openFilters.jobTypes}
                            onToggle={() => toggleFilterSection('jobTypes')}
                        >
                            {filterStats.types.map(type => (
                                <CheckboxFilter
                                    key={type}
                                    label={type}
                                    checked={filters.types.includes(type)}
                                    onChange={() => handleFilterChange('types', type)}
                                />
                            ))}
                        </FilterAccordion>

                        <FilterAccordion
                            title="Organizations"
                            isOpen={openFilters.organizations}
                            onToggle={() => toggleFilterSection('organizations')}
                        >
                            {filterStats.organizations.map(org => (
                                <CheckboxFilter
                                    key={org}
                                    label={org}
                                    checked={filters.organizations.includes(org)}
                                    onChange={() => handleFilterChange('organizations', org)}
                                />
                            ))}
                        </FilterAccordion>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-8">
                {/* Search Bar */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-3 shadow-xl backdrop-blur-md">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="What do you want to do?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none rounded-[2rem] py-4 pl-14 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-lg font-medium"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-2"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Bar */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-white">{filteredJobs.length.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Jobs matched</span>
                    </div>

                </div>



                {/* Job List */}
                <div className="space-y-6">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all duration-300 group shadow-lg"
                            >
                                <div className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors cursor-pointer">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={16} className="text-slate-600" />
                                                    {job.organization_name || 'Autonomous Startup'}
                                                </div>
                                                <span className="text-slate-700">•</span>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-slate-600" />
                                                    {job.location}
                                                </div>
                                                <span className="text-slate-700">•</span>
                                                <div className="flex items-center gap-1.5 capitalize">
                                                    <Layers size={16} className="text-slate-600" />
                                                    {job.experience_level?.toLowerCase()} Level
                                                </div>
                                                {job.degree && (
                                                    <>
                                                        <span className="text-slate-700">•</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <GraduationCap size={16} className="text-slate-600" />
                                                            {job.degree}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                    </div>

                                    {/* Minimum Qualifications */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Minimum qualifications</h4>
                                        <ul className="space-y-2.5">
                                            {(job.requirements || []).slice(0, 3).map((req, i) => (
                                                <li key={i} className="flex items-start text-sm text-slate-400 leading-relaxed">
                                                    <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0"></span>
                                                    {req}
                                                </li>
                                            ))}
                                            {(job.requirements || []).length > 3 && (
                                                <li className="text-xs text-primary font-bold ml-4.5 cursor-pointer hover:underline">
                                                    + {(job.preferred_qualifications?.length || 0) + (job.requirements.length - 3)} more qualifications
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div className="px-8 py-6 bg-slate-800/30 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <a
                                            href={`/jobs/${job.id}`}
                                            className="px-6 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl text-sm font-bold transition-all"
                                        >
                                            Learn more
                                        </a>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={12} />
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-[3rem]">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-800">
                                <Search size={40} className="text-slate-700" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No matching roles found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium">
                                We couldn't find any jobs matching your current filter criteria. Try adjusting your search or filters.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default Jobs;
