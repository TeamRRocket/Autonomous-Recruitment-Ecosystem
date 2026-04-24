import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepIndicator from '../../components/wizard/StepIndicator';
import Step1JobDescription from '../../components/wizard/Step1JobDescription';
import Step2SelectRounds from '../../components/wizard/Step2SelectRounds';
import Step3ConfigureRounds from '../../components/wizard/Step3ConfigureRounds';
import Step4ReviewPublish from '../../components/wizard/Step4ReviewPublish';
import { createJob, updateJob, publishJob } from '../../services/jobService';
import { saveRounds } from '../../services/roundService';
import toast from 'react-hot-toast';

const STEPS = [
    { label: 'Job Description' },
    { label: 'Select Rounds' },
    { label: 'Configure Rounds' },
    { label: 'Review & Publish' }
];

const JobCreationWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [jobId, setJobId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Core Job Data
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        experience_level: 'Entry',
        description: '',
        responsibilities: [],
        expires_at: '',
        degree: 'Bachelor\'s',
        preferred_qualifications: []
    });

    // Selected & Configured Rounds
    const [selectedRounds, setSelectedRounds] = useState([]);

    const buildAptitudeConfig = (rounds) => {
        const apt = (rounds || []).find(r => r?.id === 'aptitude');
        if (!apt) {
            return {
                aptitude_enabled: false,
                aptitude_level: null,
                aptitude_duration_minutes: null,
                aptitude_question_count: null
            };
        }

        const level = (apt.difficulty_level || 'MEDIUM').toString().trim().toLowerCase();
        const normalizedLevel = ['easy', 'medium', 'hard'].includes(level) ? level : 'medium';

        return {
            aptitude_enabled: true,
            aptitude_level: normalizedLevel,
            aptitude_duration_minutes: apt.duration_minutes ? parseInt(apt.duration_minutes) : 60,
            aptitude_question_count: apt.num_questions ? parseInt(apt.num_questions) : 10
        };
    };

    const buildPipelineConfig = (rounds) => {
        // No-gap pipeline: if aptitude is selected, default it as first; otherwise DSA.
        const hasApt = (rounds || []).some(r => r?.id === 'aptitude');
        return { pipeline_first_round: hasApt ? 'APTITUDE' : 'DSA' };
    };

    const handleNext = async (stepData = null) => {
        let currentData = formData;
        if (stepData) {
            currentData = { ...formData, ...stepData };
            setFormData(currentData);
        }

        if (step === 1) {
            const success = await handleSaveJobDraft(currentData);
            if (!success) return;
        } else if (step === 3) {
            const success = await handleSaveRoundsDraft();
            if (!success) return;
        }
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = (toStep = null) => {
        if (toStep) {
            setStep(toStep);
        } else {
            setStep(prev => prev - 1);
        }
        window.scrollTo(0, 0);
    };

    const handleSaveJobDraft = async (data = formData) => {
        setIsSaving(true);
        try {
            const aptitudeCfg = buildAptitudeConfig(selectedRounds);
            const pipelineCfg = buildPipelineConfig(selectedRounds);
            const payload = {
                ...data,
                status: 'DRAFT',
                requirements: data.responsibilities, // Temporary mapping if needed by backend
                ...aptitudeCfg
                ,
                ...pipelineCfg
            };

            if (jobId) {
                await updateJob(jobId, payload);
            } else {
                const res = await createJob(payload);
                setJobId(res.data.id);
            }
            toast.success('Progress saved as draft');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save draft');
            console.error(err);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveRoundsDraft = async () => {
        if (!jobId) return;
        setIsSaving(true);
        try {
            const roundsPayload = selectedRounds.map((r, i) => ({
                round_name: r.round_name || r.name,
                round_type: r.type,
                round_order: i + 1,
                duration_minutes: parseInt(r.duration_minutes),
                num_questions: r.num_questions ? parseInt(r.num_questions) : null,
                difficulty_level: r.difficulty_level || 'MEDIUM',
                passing_criteria: { score: parseInt(r.passing_score || 60) }
            }));

            await saveRounds(jobId, roundsPayload);

            // Persist aptitude config onto the job row (backend reads from jobs table for aptitude)
            const aptitudeCfg = buildAptitudeConfig(selectedRounds);
            const pipelineCfg = buildPipelineConfig(selectedRounds);
            await updateJob(jobId, { ...aptitudeCfg, ...pipelineCfg });

            toast.success('Rounds configuration saved');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save rounds');
            console.error(err);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!jobId) return;
        setIsSaving(true);
        try {
            // Ensure everything is saved first
            await handleSaveJobDraft();
            await handleSaveRoundsDraft();

            // Call publish endpoint
            await publishJob(jobId);
            toast.success('Job published successfully! Now live for candidates.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to publish job');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 animate-fade-in flex items-start justify-center">
            <div className="max-w-3xl mx-auto w-full">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">HireFlow Architect</h1>
                    <p className="text-sm text-muted-foreground">Create and Configure Your Job Posting</p>
                </div>

                {/* Stepper */}
                <div className="mb-8">
                     <StepIndicator currentStep={step} steps={STEPS} />
                </div>

                {/* Wizard Container */}
                <div className="glass-card rounded-xl border border-border bg-card/30 p-8 shadow-2xl">
                    {/* Step Content */}
                    <div>
                        {step === 1 && (
                            <Step1JobDescription
                                formData={formData}
                                setFormData={setFormData}
                                onNext={handleNext}
                            />
                        )}
                        {step === 2 && (
                            <Step2SelectRounds
                                selectedRounds={selectedRounds}
                                setSelectedRounds={setSelectedRounds}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {step === 3 && (
                            <Step3ConfigureRounds
                                selectedRounds={selectedRounds}
                                setSelectedRounds={setSelectedRounds}
                                onNext={handleNext}
                                onBack={handleBack}
                            />
                        )}
                        {step === 4 && (
                            <Step4ReviewPublish
                                formData={formData}
                                selectedRounds={selectedRounds}
                                onBack={handleBack}
                                onPublish={handlePublish}
                                isPublishing={isSaving}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobCreationWizard;
