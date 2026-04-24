import React from 'react';

const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="w-full flex items-center gap-6 border-b border-border/20 overflow-x-auto no-scrollbar">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <div 
                        key={stepNumber} 
                        className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap px-1 cursor-default select-none ${
                            isActive 
                                ? 'border-primary text-primary' 
                                : isCompleted
                                    ? 'border-transparent text-foreground/70 hover:text-foreground'
                                    : 'border-transparent text-muted-foreground/50'
                        }`}
                    >
                        {step.label}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
