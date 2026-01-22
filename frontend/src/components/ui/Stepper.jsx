import React from 'react';
import { Check } from 'lucide-react';

const Stepper = ({ steps, currentStep }) => {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    // const isPending = index > currentStep;

                    return (
                        <div key={index} className="flex items-center">
                            {/* Step Circle */}
                            <div className="relative flex flex-col items-center group">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : isCurrent
                                                ? 'bg-slate-800 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                : 'bg-slate-800 border-slate-600 text-slate-500'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check size={20} />
                                    ) : (
                                        <span className="font-semibold text-sm">{index + 1}</span>
                                    )}
                                </div>
                                {/* Label */}
                                <div className={`absolute top-12 whitespace-nowrap text-xs font-medium transition-colors ${isCurrent ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                                    }`}>
                                    {step}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-blue-600' : 'bg-slate-700'
                                        }`}
                                ></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;
