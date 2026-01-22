import React from 'react';
import { Check } from 'lucide-react';

const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div key={stepNumber} className="flex flex-col items-center relative flex-1">
                            {/* Line connecting steps */}
                            {index !== 0 && (
                                <div
                                    className={`absolute top-5 -left-1/2 w-full h-0.5 -z-10 ${isCompleted ? 'bg-blue-600' : 'bg-slate-700'
                                        }`}
                                />
                            )}

                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-slate-900 border-slate-700 text-slate-500'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check size={20} weight="bold" />
                                ) : (
                                    <span className="text-sm font-bold">{stepNumber}</span>
                                )}
                            </div>

                            <span
                                className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-blue-400' : 'text-slate-500'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
