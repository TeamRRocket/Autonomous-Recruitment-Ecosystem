import React from 'react';

const InputGroup = ({ label, name, type = "text", placeholder, required = false, isTextArea = false, options = null, value, onChange, onKeyDown }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {isTextArea ? (
            <textarea
                id={name}
                name={name}
                rows={6}
                required={required}
                className="input-field bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-lg p-3 transition-colors duration-200"
                placeholder={placeholder}
                value={value || ''}
                onChange={onChange}
            />
        ) : options ? (
            <select
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className="input-field bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-lg p-2.5 transition-colors duration-200"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : (
            <input
                id={name}
                name={name}
                type={type}
                required={required}
                className={`input-field bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-lg p-2.5 transition-colors duration-200 ${type === 'date' ? '[color-scheme:dark]' : ''}`}
                placeholder={placeholder}
                value={value || ''}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
        )}
    </div>
);

export default InputGroup;
